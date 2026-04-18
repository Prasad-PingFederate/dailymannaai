// app/api/test-db/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    // Test Supabase
    const { data: devotions, error: supabaseError } = await supabase
      .from('devotions')
      .select('count')
      .single();

    if (supabaseError) {
      throw new Error(`Supabase: ${supabaseError.message}`);
    }

    // Test MongoDB
    const db = await getDatabase();
    await db.command({ ping: 1 });

    return NextResponse.json({
      success: true,
      message: 'Both databases connected! ✅',
      supabase: { connected: true },
      mongodb: { connected: true }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
