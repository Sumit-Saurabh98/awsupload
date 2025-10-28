"use client";

import { CustomForm, FieldConfig } from "@/components/CustomForm";
import z from "zod";

const LoginPage = ({ onSwitchToSignup }: { onSwitchToSignup: () => void }) => {
  const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  });

  const loginFields: FieldConfig[] = [
    { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter your email' },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Enter your password' },
  ];

  const handleLogin = (data: Record<string, unknown>) => {
    console.log('Login Data:', data);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Login</h2>
      <CustomForm fields={loginFields} schema={loginSchema} onSubmit={handleLogin} submitButtonText="Login" />
      <p className="mt-4 text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <button onClick={onSwitchToSignup} className="text-blue-600 hover:underline">
          Sign up
        </button>
      </p>
    </div>
  );
};


export default LoginPage