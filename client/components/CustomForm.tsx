"use client"

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, ChevronDown } from 'lucide-react';

// Dropzone Component
const Dropzone = ({ value, onChange, error }: { value: File[]; onChange: (files: File[]) => void; error?: string }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    onChange([...value, ...files]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onChange([...value, ...files]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">Drag and drop files here, or click to select</p>
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="mt-2 inline-block px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600"
        >
          Select Files
        </label>
      </div>
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Multi-Select Dropdown Component
const MultiSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder 
}: { 
  options: { value: string; label: string }[]; 
  value: string[]; 
  onChange: (value: string[]) => void; 
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const selectedLabels = options
    .filter(opt => value.includes(opt.value))
    .map(opt => opt.label)
    .join(', ');

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 rounded-md bg-white flex items-center justify-between hover:border-gray-400"
      >
        <span className={value.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
          {value.length === 0 ? placeholder : selectedLabels}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => toggleOption(option.value)}
                className="mr-2 h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-900">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// Custom Form Component
export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'password' | 'select' | 'multiselect' | 'textarea' | 'file' | 'radio';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface CustomFormProps {
  fields: FieldConfig[];
  schema: z.ZodObject<z.ZodRawShape>;
  onSubmit: (data: Record<string, unknown>) => void;
  submitButtonText?: string;
}

export const CustomForm = ({ fields, schema, onSubmit, submitButtonText = 'Submit' }: CustomFormProps) => {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: fields.reduce((acc, field) => {
      if (field.type === 'file') {
        acc[field.name] = [];
      } else if (field.type === 'multiselect') {
        acc[field.name] = [];
      } else if (field.type === 'number') {
        // Keep controlled from mount: use empty string for number inputs
        acc[field.name] = '';
      } else {
        acc[field.name] = '';
      }
      return acc;
    }, {} as Record<string, unknown>),
  });

  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label}
          </label>
          <Controller
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <>
                {field.type === 'textarea' ? (
                  <textarea
                    {...formField}
                    placeholder={field.placeholder}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[field.name] ? 'border-red-500' : 'border-gray-300'}`}
                    rows={4}
                    value={(formField.value as string) ?? ''}
                    onChange={(e) => formField.onChange(e.target.value)}
                  />
                ) : field.type === 'select' ? (
                  <select
                    {...formField}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[field.name] ? 'border-red-500' : 'border-gray-300'}`}
                    value={(formField.value as string) ?? ''}
                    onChange={(e) => formField.onChange(e.target.value)}
                  >
                    <option value="">Select an option</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'multiselect' ? (
                  <div className={errors[field.name] ? 'border border-red-500 rounded-md' : ''}>
                    <MultiSelect
                      options={field.options || []}
                      value={(formField.value as string[]) ?? []}
                      onChange={formField.onChange}
                      placeholder={field.placeholder}
                    />
                  </div>
                ) : field.type === 'file' ? (
                  <Dropzone
                    value={(formField.value as File[]) ?? []}
                    onChange={formField.onChange}
                    error={errors[field.name]?.message as string}
                  />
                ) : field.type === 'radio' ? (
                  <div className={`space-y-2 ${errors[field.name] ? 'border border-red-500 rounded-md p-2' : ''}`}>
                    {field.options?.map((opt) => (
                      <label key={opt.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value={opt.value}
                          checked={formField.value === opt.value}
                          onChange={() => formField.onChange(opt.value)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-900">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    {...formField}
                    type={field.type}
                    placeholder={field.placeholder}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[field.name] ? 'border-red-500' : 'border-gray-300'}`}
                    value={
                      field.type === 'number'
                        ? String((formField.value as string | number | undefined) ?? '')
                        : ((formField.value as string) ?? '')
                    }
                    onChange={(e) => {
                      if (field.type === 'number') {
                        const v = e.target.value;
                        // keep DOM controlled with string, but store numeric when possible
                        formField.onChange(v === '' ? '' : Number(v));
                      } else {
                        formField.onChange(e.target.value);
                      }
                    }}
                  />
                )}
              </>
            )}
          />
          {errors[field.name] && (
            <p className="mt-1 text-sm text-red-600">{errors[field.name]?.message as string}</p>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={handleSubmit(onSubmit)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {submitButtonText}
      </button>
    </div>
  );
};