
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log('--- Checking Columns for Products Table ---');
    const tests = ['gst_rate', 'hsn_code', 'unit', 'status', 'serial_number', 'warranty', 'model', 'branch', 'created_by'];

    for (const col of tests) {
        const payload = { id: 'COL_CHECK', name: 'tmp', price: 0, stock: 0 };
        payload[col] = (col === 'gst_rate' ? 0 : 'test');

        const { error } = await supabase.from('products').insert(payload);

        if (error && error.message.includes(`column "${col}" of relation "products" does not exist`)) {
            console.log(`❌ Column MISSING: ${col}`);
        } else if (error && !error.message.includes('duplicate key')) {
            console.log(`ℹ️ Column ${col} check result: ${error.message}`);
        } else {
            console.log(`✅ Column EXISTS: ${col}`);
            // Cleanup if it worked (though we use same ID)
            await supabase.from('products').delete().eq('id', 'COL_CHECK');
        }
    }
}
check();
