const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://kkfgdzaoukekhlijlfsw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZmdkemFvdWtla2hsaWpsZnN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjgyOTkxMCwiZXhwIjoyMDk4NDA1OTEwfQ.0yXNbCGnCws6-EQBDN859yK_atM1ITKJ9XbL-uBj_DU'
);
async function run() {
  const { data, error } = await supabase
    .from('phone_otps')
    .select('otp')
    .eq('phone', '+918877434088')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error) {
    console.log('ERROR:', error.message);
  } else {
    console.log('OTP:', data.otp);
  }
}
run();
