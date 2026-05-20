/** Top navigation bar with branding and links to Products, Dashboard, and Login. Server component. */
import Link from "next/link";
import { Package } from "lucide-react";

/** Renders the app brand, Products/Dashboard nav links, and Iniciar Sesión button. */
export function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary-600" />
            <span className="font-semibold text-gray-900">Inventario</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/products"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Productos
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
