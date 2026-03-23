import { signIn } from "@/auth"
import Link from "next/link"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  const error = searchParams?.error;
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Vítejte zpět</h1>
        <p className="text-sm text-gray-500 mb-8 text-center">Přihlaste se do Skautského plánovače programu a pokračujte v přípravě.</p>
        
        <form
          className="w-full flex justify-center"
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: "/" })
          }}
        >
          <button type="submit" className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            Přihlásit se přes Google
          </button>
        </form>



        <div className="w-full mt-6 relative flex items-center justify-center mb-6">
          <div className="w-full border-t border-gray-200 absolute"></div>
          <span className="bg-white px-3 text-xs text-gray-400 font-bold uppercase tracking-wider relative z-10">nebo lokálně</span>
        </div>

        {error === "CredentialsSignin" && (
          <div className="w-full text-red-600 text-sm font-bold text-center mb-2 bg-red-50 p-3 rounded-xl border border-red-100 shadow-inner">
            Nesprávný email nebo heslo. Zkuste to prosím znovu.
          </div>
        )}

        <form
          className="w-full mt-2 space-y-4"
          action={async (formData) => {
            "use server"
            try {
              await signIn("credentials", {
                email: formData.get("email"),
                password: formData.get("password"),
                redirectTo: "/",
              })
            } catch (e) {
              if (e instanceof AuthError) {
                redirect("/login?error=CredentialsSignin")
              }
              throw e
            }
          }}
        >
          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Email</label>
             <input name="email" type="email" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold" placeholder="jmeno@skaut.cz" />
          </div>
          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Heslo</label>
             <input name="password" type="password" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95">Přihlásit se</button>
        </form>

        <p className="mt-8 text-sm text-gray-500">
          Nemáte vytvořený účet?{" "}
          <Link href="/register" className="text-blue-600 font-bold hover:underline">
            Zaregistrujte se
          </Link>
        </p>
      </div>
    </div>
  )
}
