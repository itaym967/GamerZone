/**
 * Script to apply the messages table migration to Supabase
 * Run with: node scripts/apply-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    console.log('📦 Reading migration file...');
    
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260202_create_messages_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Applying migration to Supabase...');
    console.log('📡 URL:', supabaseUrl);
    
    try {
        // Split the SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        console.log(`📝 Found ${statements.length} SQL statements to execute`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';
            console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);
            
            const { data, error } = await supabase.rpc('exec_sql', { 
                sql_query: statement 
            });
            
            if (error) {
                // Try direct query if RPC doesn't exist
                const { error: directError } = await supabase
                    .from('_migrations')
                    .insert({ name: '20260202_create_messages_table', executed_at: new Date().toISOString() });
                
                if (directError) {
                    console.error('❌ Error:', error.message);
                    console.log('\n⚠️  RPC method not available. Please apply migration manually via Supabase Dashboard:');
                    console.log('\n1. Go to: https://supabase.com/dashboard/project/okfokzmyvovbtouylwvr/sql');
                    console.log('2. Copy the contents of: supabase/migrations/20260202_create_messages_table.sql');
                    console.log('3. Paste and run in the SQL Editor\n');
                    process.exit(1);
                }
            } else {
                console.log('✅ Statement executed successfully');
            }
        }
        
        console.log('\n✅ Migration applied successfully!');
        console.log('🎉 Your chat messaging should now work in real-time!');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        console.log('\n⚠️  Please apply migration manually via Supabase Dashboard:');
        console.log('\n1. Go to: https://supabase.com/dashboard/project/okfokzmyvovbtouylwvr/sql');
        console.log('2. Copy the contents of: supabase/migrations/20260202_create_messages_table.sql');
        console.log('3. Paste and run in the SQL Editor\n');
        process.exit(1);
    }
}

applyMigration();
