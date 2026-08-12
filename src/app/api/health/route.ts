import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const results: any = {
    env_DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
    env_DIRECT_URL: process.env.DIRECT_URL ? "SET" : "MISSING",
    env_NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING",
    env_NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING",
  };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();
    results.supabase_status = error ? `Error: ${error.message}` : "OK";
  } catch (e: any) {
    results.supabase_status = `Exception: ${e.message}`;
  }

  try {
    const userCount = await prisma.user.count();
    results.prisma_status = `OK, found ${userCount} users`;
  } catch (e: any) {
    results.prisma_status = `Exception: ${e.message}`;
    results.prisma_code = e.code;
    results.prisma_meta = e.meta;
  }

  return NextResponse.json(results);
}
