import { Link, Outlet, useLoaderData, NavLink } from "react-router";
import type { Route } from "./+types/tenant.layout";
import { apiClient } from "../lib/api";

export async function loader({ params }: Route.LoaderArgs) {
  const tenant = await apiClient.getTenant(params.tenantId);
  return { tenant };
}

export default function TenantLayout() {
  const { tenant } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to={`/tenant/${tenant.id}`} className="text-xl font-bold text-indigo-600">
                  {tenant.name}
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink
                  to={`/tenant/${tenant.id}`}
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                  end
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to={`/tenant/${tenant.id}/contacts`}
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  Contacts
                </NavLink>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500">
                Schema: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{tenant.schema_name}</code>
              </span>
              <Link
                to="/"
                className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Switch Tenant
              </Link>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <NavLink
              to={`/tenant/${tenant.id}`}
              className={({ isActive }) =>
                `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300'
                }`
              }
              end
            >
              Dashboard
            </NavLink>
            <NavLink
              to={`/tenant/${tenant.id}/contacts`}
              className={({ isActive }) =>
                `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300'
                }`
              }
            >
              Contacts
            </NavLink>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}