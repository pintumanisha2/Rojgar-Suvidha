import webpush from 'web-push';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Ensure env variables exist, otherwise webpush throws an error
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@rojgarsuvidha.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(req: Request) {
  try {
    const { subscription, action, payload, userId, categories } = await req.json();

    if (action === 'test' || action === 'subscribe') {
      // 1. Save subscription to Supabase with categories embedded in subscription_data
      const subscriptionWithCategories = {
        ...subscription,
        categories: categories || ["latest-jobs", "results", "admit-cards", "news", "answer-key"]
      };

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({ 
          endpoint: subscription.endpoint, 
          user_id: userId || null,
          subscription_data: subscriptionWithCategories 
        }, { onConflict: 'endpoint' });

      if (error) {
        console.error("Failed to save subscription to DB:", error);
      }

      // 2. Send a test/welcome notification back immediately
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: 'Welcome to Rojgar Suvidha! 🎉',
          body: 'Job alerts are now active. You will receive updates instantly.',
          url: '/',
          icon: '/logo-blue.png'
        })
      );
      return NextResponse.json({ success: true, message: 'Subscribed and test push sent' });
    }

    if (action === 'broadcast' || action === 'category-broadcast') {
      // Fetch all subscriptions from Supabase
      const { data: subs, error } = await supabase
        .from('push_subscriptions')
        .select('subscription_data');

      if (error) throw error;
      if (!subs || subs.length === 0) {
        return NextResponse.json({ success: true, message: 'No active subscribers found.' });
      }

      // Prepare payload (fallback to generic if not provided)
      const notificationPayload = payload || {
        title: 'New Update on Rojgar Suvidha! 🚀',
        body: 'Check out the latest job notification or admit card now.',
        url: '/',
        icon: '/logo-blue.png'
      };

      const targetCategory = payload?.category || null;

      // Loop through all subscriptions and send push (filtering by category if category-broadcast)
      const sendPromises = subs.map(async (sub: any) => {
        try {
          const subData = sub.subscription_data;
          // Filter out if category-broadcast and user doesn't have target category in preferences
          if (action === 'category-broadcast' && targetCategory) {
            const userCats = subData.categories || [];
            if (!userCats.includes(targetCategory)) return;
          }
          
          await webpush.sendNotification(subData, JSON.stringify(notificationPayload));
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
             await supabase.from('push_subscriptions').delete().eq('endpoint', sub.subscription_data.endpoint);
          }
          console.error("Error sending to a subscriber:", err.message);
        }
      });

      await Promise.allSettled(sendPromises);

      return NextResponse.json({ success: true, message: `Broadcast processed for active subscribers` });
    }

    if (action === 'send_to_user') {
      if (!userId) {
        return NextResponse.json({ error: "Missing userId" }, { status: 400 });
      }

      // Fetch active subscriptions for this targeted user ID
      const { data: subs, error } = await supabase
        .from('push_subscriptions')
        .select('subscription_data')
        .eq('user_id', userId);

      if (error) throw error;
      if (!subs || subs.length === 0) {
        return NextResponse.json({ success: true, message: 'No active push subscriptions for this user.' });
      }

      const sendPromises = subs.map(async (sub: any) => {
        try {
          await webpush.sendNotification(sub.subscription_data, JSON.stringify(payload));
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
             // Delete inactive subscriptions
             await supabase.from('push_subscriptions').delete().eq('endpoint', sub.subscription_data.endpoint);
          }
          console.error("Error sending user push notification:", err.message);
        }
      });

      await Promise.allSettled(sendPromises);
      return NextResponse.json({ success: true, message: `Notification sent to ${subs.length} devices.` });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Push Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
