"use client";

import { z } from 'zod';
import  { FieldConfig, CustomForm} from '@/components/CustomForm';


const SignupPage = ({ onSwitchToLogin }: { onSwitchToLogin: () => void }) => {
  const signupSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  });

  const signupFields: FieldConfig[] = [
    { name: 'username', label: 'Username', type: 'text', placeholder: 'Enter your username' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter your email' },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Enter your password' },
  ];

  const handleSignup = (data: Record<string, unknown>) => {
    console.log('Signup Data:', data);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Sign Up</h2>
      <CustomForm fields={signupFields} schema={signupSchema} onSubmit={handleSignup} submitButtonText="Sign Up" />
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-blue-600 hover:underline">
          Login
        </button>
      </p>
    </div>
  );
};


export default SignupPage;