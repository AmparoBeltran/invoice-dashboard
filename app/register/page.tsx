import AcmeLogo from '@/app/ui/acme-logo';
import RegisterForm from '@/app/ui/register-form';
import { Metadata } from 'next';
import { SignInWithGoogle } from '../ui/signin-with-google';
import { lusitana } from '@/app/ui/fonts';

export const metadata: Metadata = {
  title: 'Register',
};

export default function RegisterPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-500 p-3 md:h-36">
          <div className="flex w-full grow flex-col  items-center justify-center gap-4 text-white">
            <AcmeLogo />
            <h1 className={`${lusitana.className} mb-3 text-2xl`}>
              Please register to continue.
            </h1>
          </div>
        </div>
        <SignInWithGoogle />
        <RegisterForm />
      </div>
    </main>
  );
}
