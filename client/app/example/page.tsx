"use client";

import { CustomForm, FieldConfig } from "@/components/CustomForm";
import z from "zod";

const Example = () => {
  const allFieldsSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    age: z.number().min(18, 'Must be at least 18 years old'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    country: z.string().min(1, 'Please select a country'),
    skills: z.array(z.string()).min(1, 'Select at least one skill'),
    bio: z.string().min(10, 'Bio must be at least 10 characters'),
    resume: z.array(z.instanceof(File)).min(1, 'Please upload at least one file'),
    gender: z.string().min(1, 'Please select a gender'),
  });

  const allFields: FieldConfig[] = [
    { name: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Enter your full name' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter your email' },
    { name: 'age', label: 'Age', type: 'number', placeholder: 'Enter your age' },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Create a password' },
    {
      name: 'country',
      label: 'Country',
      type: 'select',
      options: [
        { value: 'us', label: 'United States' },
        { value: 'uk', label: 'United Kingdom' },
        { value: 'in', label: 'India' },
        { value: 'ca', label: 'Canada' },
      ],
    },
    {
      name: 'skills',
      label: 'Skills',
      type: 'multiselect',
      placeholder: 'Select your skills',
      options: [
        { value: 'javascript', label: 'JavaScript' },
        { value: 'react', label: 'React' },
        { value: 'nodejs', label: 'Node.js' },
        { value: 'python', label: 'Python' },
        { value: 'typescript', label: 'TypeScript' },
      ],
    },
    { name: 'bio', label: 'Bio', type: 'textarea', placeholder: 'Tell us about yourself' },
    { name: 'resume', label: 'Resume', type: 'file' },
    {
      name: 'gender',
      label: 'Gender',
      type: 'radio',
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
      ],
    },
  ];

  const handleAllFieldsSubmit = (data: Record<string, unknown>) => {
    console.log('All Fields Data:', data);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Complete Form</h2>
      <CustomForm fields={allFields} schema={allFieldsSchema} onSubmit={handleAllFieldsSubmit} />
    </div>
  );
};

export default Example;