import { Form, redirect, useActionData, useNavigation, useLoaderData } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/_index";
import { apiClient, ApiError } from "../lib/api";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Multi-Tenant CRM - Access Your Workspace" },
    {
      name: "description",
      content: "Create a new tenant or access your existing CRM workspace",
    },
  ];
};

export async function loader(): Promise<{ tenants: any[] }> {
  try {
    const tenants = await apiClient.getTenants();
    return { tenants };
  } catch (error) {
    // If there's an error fetching tenants, just return empty array
    console.error('Failed to fetch tenants:', error);
    return { tenants: [] };
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  if (actionType === "select") {
    const tenantId = formData.get("tenantId") as string;
    
    if (!tenantId) {
      return { error: "Please select a tenant" };
    }
    
    return redirect(`/tenant/${tenantId}`);
  }

  // Default to create action
  const name = formData.get("name") as string;

  if (!name?.trim()) {
    return { error: "Company name is required" };
  }

  try {
    const tenant = await apiClient.createTenant({ name: name.trim() });
    return redirect(`/tenant/${tenant.id}`);
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    return { error: "Failed to create tenant. Please try again." };
  }
}

export default function Index() {
  const actionData = useActionData<typeof action>();
  const { tenants } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.formAction === "/" && navigation.formMethod === "POST";

  const [activeTab, setActiveTab] = useState<'create' | 'select'>(
    tenants.length > 0 ? 'select' : 'create'
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Multi-Tenant CRM
        </h1>
        <h2 className="mt-2 text-center text-lg text-gray-600">
          {tenants.length > 0 ? 'Access your workspace or create a new one' : 'Create your company workspace'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white shadow-lg sm:rounded-lg overflow-hidden">
          {/* Tab Headers */}
          {tenants.length > 0 && (
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab('select')}
                className={`flex-1 py-4 px-6 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 ${
                  activeTab === 'select'
                    ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Select Existing ({tenants.length})
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-4 px-6 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 ${
                  activeTab === 'create'
                    ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New
                </div>
              </button>
            </div>
          )}

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'select' && tenants.length > 0 ? (
              <Form method="post" className="space-y-6">
                <input type="hidden" name="actionType" value="select" />
                <div>
                  <label htmlFor="tenantId" className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Your Workspace
                  </label>
                  <div className="space-y-3">
                    {tenants.map((tenant) => (
                      <label
                        key={tenant.id}
                        className="relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 group has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 has-[:checked]:ring-2 has-[:checked]:ring-indigo-200 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                      >
                        <div className="relative">
                          <input
                            type="radio"
                            name="tenantId"
                            value={tenant.id}
                            className="sr-only peer"
                          />
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center peer-checked:border-indigo-600 peer-checked:bg-indigo-600 transition-colors duration-200">
                            <div className="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200"></div>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-gray-900 group-has-[:checked]:text-indigo-900">{tenant.name}</div>
                              <div className="text-xs text-gray-500 group-has-[:checked]:text-indigo-700">Schema: {tenant.schema_name}</div>
                            </div>
                            <div className="text-xs text-gray-400 group-has-[:checked]:text-indigo-600">
                              Created {new Date(tenant.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {/* Selected indicator */}
                        <div className="absolute top-2 right-2 opacity-0 group-has-[:checked]:opacity-100 transition-opacity duration-200">
                          <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {actionData?.error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-semibold text-red-700">{actionData.error}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Accessing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Access Dashboard
                      </>
                    )}
                  </button>
                </div>
              </Form>
            ) : (
              <Form method="post" className="space-y-6">
                <input type="hidden" name="actionType" value="create" />
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="block w-full pl-10 pr-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                      placeholder="Enter your company name"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {actionData?.error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-semibold text-red-700">{actionData.error}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Tenant...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Tenant
                      </>
                    )}
                  </button>
                </div>
              </Form>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 font-medium">Isolated Schemas</span>
              </div>
              <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-blue-800 font-medium">Contact Management</span>
              </div>
              <div className="flex items-center justify-center p-3 bg-purple-50 rounded-lg">
                <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-purple-800 font-medium">Message Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}