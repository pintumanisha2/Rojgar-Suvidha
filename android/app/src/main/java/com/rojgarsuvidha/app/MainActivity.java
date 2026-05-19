import android.Manifest;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private long backPressedTime = 0;
    private static final long BACK_PRESS_INTERVAL = 2000;
    private static final int NOTIFICATION_PERMISSION_CODE = 101;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Status bar brand color (Indigo)
        Window window = getWindow();
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.parseColor("#4f46e5"));

        // WebView performance
        WebView.setWebContentsDebuggingEnabled(false);

        // Android 13+ par notification permission maango
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        NOTIFICATION_PERMISSION_CODE);
            }
        }

        // Handle Deep Links (notification click se specific page khulne ke liye)
        handleDeepLink(getIntent());

        // App Rating Prompt (5th launch ke baad)
        showRatingPromptIfNeeded();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleDeepLink(intent);
    }

    private void handleDeepLink(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data != null && getBridge() != null) {
            String url = data.toString();
            // Load specific URL in WebView
            getBridge().getWebView().post(() ->
                getBridge().getWebView().loadUrl(url)
            );
        }
    }

    private void showRatingPromptIfNeeded() {
        SharedPreferences prefs = getSharedPreferences("rs_prefs", MODE_PRIVATE);
        boolean ratingDone = prefs.getBoolean("rating_done", false);
        if (ratingDone) return;

        int launches = prefs.getInt("launch_count", 0) + 1;
        prefs.edit().putInt("launch_count", launches).apply();

        if (launches == 5) {
            new AlertDialog.Builder(this)
                .setTitle("Rojgar Suvidha pasand aaya? ⭐")
                .setMessage("Agar hum aapki madad kar paye toh Play Store par 5 star zaroor den!")
                .setPositiveButton("⭐ Rate Karein", (d, w) -> {
                    prefs.edit().putBoolean("rating_done", true).apply();
                    startActivity(new Intent(Intent.ACTION_VIEW,
                        Uri.parse("market://details?id=com.rojgarsuvidha.app")));
                })
                .setNeutralButton("Baad Mein", null)
                .setNegativeButton("Nahi Chahiye", (d, w) ->
                    prefs.edit().putBoolean("rating_done", true).apply()
                )
                .show();
        }
    }

    @Override
    public void onBackPressed() {
        if (getBridge() != null && getBridge().getWebView().canGoBack()) {
            // Go back in web history
            getBridge().getWebView().goBack();
        } else {
            // Double press back to exit
            if (System.currentTimeMillis() - backPressedTime < BACK_PRESS_INTERVAL) {
                moveTaskToBack(true);
            } else {
                backPressedTime = System.currentTimeMillis();
                Toast.makeText(this, "Bahar jaane ke liye dobara press karein", Toast.LENGTH_SHORT).show();
            }
        }
    }

    // Check internet connectivity
    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        if (cm != null) {
            NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
            return activeNetwork != null && activeNetwork.isConnectedOrConnecting();
        }
        return false;
    }
}


