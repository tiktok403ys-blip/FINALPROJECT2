const { createClient } = require('./lib/supabase/server.js');

(async () => {
  try {
    const supabase = await createClient();
    const { data: casinos, error } = await supabase.from('casinos').select('*').limit(10);

    if (error) {
      console.log('Error:', error.message);
    } else {
      console.log('Current casinos in database:');
      console.log(`Total casinos found: ${casinos.length}`);
      casinos.forEach(casino => {
        console.log(`- ${casino.name} (Rating: ${casino.rating}) - ${casino.website_url}`);
        console.log(`  Description: ${casino.description?.substring(0, 50)}...`);
        console.log(`  Created: ${casino.created_at}`);
        console.log('');
      });
    }
  } catch (err) {
    console.log('Connection error:', err.message);
  }
})();
