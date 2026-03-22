import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  async function register(formData: FormData) {
    "use server"

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!name || !email || !password) {
      throw new Error("Všechna pole jsou povinná")
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error("Uživatel s tímto emailem již existuje")
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    redirect("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Založení účtu</h1>
        <p className="text-sm text-gray-500 mb-8 text-center">Vyplňte údaje pro registraci do Plánovače.</p>

        <form className="w-full space-y-4" action={register}>
          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Jméno</label>
             <input name="name" type="text" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold" placeholder="Jan Skaut" />
          </div>
          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Email</label>
             <input name="email" type="email" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold" placeholder="jmeno@skaut.cz" />
          </div>
          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Heslo</label>
             <input name="password" type="password" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full py-3 mt-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95">Zaregistrovat se</button>
        </form>

        <p className="mt-8 text-sm text-gray-500">
          Už máte vytvořený účet?{" "}
          <Link href="/login" className="text-blue-600 font-bold hover:underline">
            Přihlaste se
          </Link>
        </p>
      </div>
    </div>
  )
}
