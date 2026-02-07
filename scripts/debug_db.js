const { PrismaClient } = require('@prisma/client');
const { MongoClient } = require('mongodb');
const dns = require('dns').promises;
const net = require('net');

async function testSupabase() {
    console.log('--- Testing Supabase (Diagnostics) ---');
    const host = 'db.nomakkovevlscvdkxreq.supabase.co';

    try {
        console.log(`Resolving DNS for ${host}...`);
        const addresses = await dns.lookup(host, { all: true });
        console.log('✅ DNS Resolved:', addresses);
    } catch (dnsErr) {
        console.error('❌ DNS Resolution FAILED:', dnsErr.message);
        console.log('Try this: nslookup db.nomakkovevlscvdkxreq.supabase.co');
    }

    try {
        console.log(`Checking Port 5432 on ${host}...`);
        const socket = new net.Socket();
        socket.setTimeout(5000);
        socket.connect(5432, host, () => {
            console.log('✅ Port 5432 is OPEN');
            socket.destroy();
        });
        socket.on('error', (e) => {
            console.log(`❌ Port 5432 is CLOSED: ${e.message}`);
        });
        socket.on('timeout', () => {
            console.log('❌ Port 5432 TIMEOUT');
            socket.destroy();
        });
    } catch (e) { }

    console.log('\n--- Testing Supabase (Prisma) ---');
    console.log('URL:', process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':****@')); // Hide password

    const prisma = new PrismaClient();
    try {
        const start = Date.now();
        // Simple raw query to test connection
        await prisma.$queryRaw`SELECT 1`;
        console.log(`✅ Supabase Connection SUCCESS (${Date.now() - start}ms)`);
    } catch (error) {
        console.error('❌ Supabase Connection FAILED');
        console.error('Error Code:', error.code);
        console.error('Message:', error.message);

        if (error.message.includes('P1001')) {
            console.log('\n💡 TROUBLESHOOTING P1001 (Can\'t reach server):');
            console.log('1. Check if "Allow all IPs" is enabled in Supabase Dashboard (Settings > Database > Network Restrictions).');
            console.log('2. Try using the POOLER connection string (Port 6543) instead of direct (5432).');
            console.log('3. Ensure your password is correct. If it has special characters, wrap it in encodeURIComponent or use a simpler password.');
            console.log('4. Are you on a restricted network (VPN/Corporate) that blocks Port 5432?');
        }
    } finally {
        await prisma.$disconnect();
    }
}

async function testMongoDB() {
    console.log('\n--- Testing MongoDB ---');
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;

    if (!uri || uri.includes('admin:password')) {
        console.log('⚠️  MONGODB_URI appears to be a placeholder. Please update it in .env');
        return;
    }

    const client = new MongoClient(uri);
    try {
        const start = Date.now();
        await client.connect();
        await client.db(dbName || 'test').command({ ping: 1 });
        console.log(`✅ MongoDB Connection SUCCESS (${Date.now() - start}ms)`);
    } catch (error) {
        console.error('❌ MongoDB Connection FAILED');
        console.error('Message:', error.message);
        console.log('\n💡 TROUBLESHOOTING MONGODB:');
        console.log('1. Ensure your IP is whitelisted in MongoDB Atlas (Network Access tab).');
        console.log('2. Check if the username/password in the URI are correct.');
    } finally {
        await client.close();
    }
}

async function runTests() {
    await testSupabase();
    await testMongoDB();
}

runTests();
