import { signIn } from '@/auth';
import Image from 'next/image';
import GoogleLogo from '@/public/google-logo.svg';

export function SignInWithGoogle() {
  return (
    <form
      action={async () => {
        'use server';
        await signIn('google');
      }}
    >
      <button
        type="submit"
        className="flex h-[48px] w-full grow items-center justify-center gap-4 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none"
      >
        <Image src={GoogleLogo} width={28} height={28} alt="Google logo" />
        <div>Sign in with Google</div>
      </button>
    </form>
  );
}
