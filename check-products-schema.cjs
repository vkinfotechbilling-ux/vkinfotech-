
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProducts() {
    console.log('🔗 Checking "products" table in Supabase...');

    // 1. Check if table exists and we can select from it
    const { data, error, status, statusText } = await supabase
        .from('products')
        .select('*')
        .limit(5);

    if (error) {
        console.error('❌ Error fetching products:');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
        process.exit(1);
    } else {
        console.log('✅ table "products" is accessible.');
        console.log('📊 Records found:', data.length);
        if (data.length > 0) {
            console.log('📋 First record sample:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('ℹ️ Table is empty. Trying to insert a test product...');
            const testId = `TEST_${Date.now()}`;
            const { error: insertError } = await supabase
                .from('products')
                .insert({
                    id: testId,
                    name: 'Test Connectivity Product',
                    price: 100,
                    stock: 5,
                    min_stock: 1,
                    branch: 'Main'
                });

            if (insertError) {
                console.error('❌ Failed to insert test product:', insertError.message);
            } else {
                console.log('✅ Successfully inserted test product with ID:', testId);
                // Clean up
                await supabase.from('products').delete().eq('id', testId);
            }
        }
        process.exit(0);
    }
}

checkProducts();
