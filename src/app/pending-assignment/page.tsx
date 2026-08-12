import Link from "next/link";
import { logout } from "@/app/auth/actions";

export default function PendingAssignmentPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-md p-8 bg-[#111111] border border-neutral-800 rounded-2xl shadow-2xl text-center space-y-4">
        <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Pending Assignment</h1>
        <p className="text-neutral-400">
          Your account has been verified, but your CRM profile has not yet been assigned. 
          Please contact an administrator to link your account.
        </p>
        
        <form action={logout}>
          <button type="submit" className="mt-6 px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors">
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
