"use client"
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Mail, Sparkles, Shield, ArrowRight, Zap } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export default function LoginPage() {
  const [isHovering, setIsHovering] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log('Email:', values.email);
    console.log('Password:', values.password);
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0a0e12 0%, #0f1419 50%, #1a1f26 100%)' }}>
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              background: 'radial-gradient(circle at 20% 50%, rgba(28, 156, 240, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(28, 156, 240, 0.05) 0%, transparent 50%)',
            }}
          />
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-15"
            style={{
              background: 'radial-gradient(circle, #1c9cf0 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10"
            style={{
              background: 'radial-gradient(circle, #1c9cf0 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -40, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="relative w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{
                  background: '#1c9cf0',
                  boxShadow: '0 8px 32px rgba(28, 156, 240, 0.3)',
                }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <Sparkles className="w-6 h-6 text-white" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
              <span className="text-3xl font-bold" style={{ color: '#f0f3f4' }}>
                DDReg.in
              </span>
            </div>
          </motion.div>

          {/* Welcome Text */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-10"
          >
            <h1 className="text-5xl font-bold mb-3 tracking-tight" style={{ color: '#f0f3f4' }}>
              Welcome Back
            </h1>
            <p className="text-lg" style={{ color: '#8b9299' }}>Sign in to continue your journey</p>
          </motion.div>

          {/* Glass Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="backdrop-blur-xl rounded-3xl p-8 shadow-2xl"
            style={{
              background: 'rgba(240, 243, 244, 0.03)',
              border: '1px solid rgba(240, 243, 244, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(240, 243, 244, 0.05)',
            }}
          >
            <Form {...form}>
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-sm" style={{ color: '#f0f3f4' }}>
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                              fieldState.error ? 'text-red-400' : 'text-gray-500'
                            }`} 
                            style={!fieldState.error ? { color: '#8b9299' } : {}}
                            />
                            <Input
                              placeholder="you@example.com"
                              className={`pl-12 h-14 rounded-2xl transition-all duration-300 border ${
                                fieldState.error 
                                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                                  : ''
                              }`}
                              style={!fieldState.error ? {
                                background: 'rgba(240, 243, 244, 0.05)',
                                borderColor: 'rgba(240, 243, 244, 0.1)',
                                color: '#f0f3f4',
                              } : {
                                background: 'rgba(240, 243, 244, 0.05)',
                                color: '#f0f3f4',
                              }}
                              {...field}
                            />
                            <motion.div
                              className="absolute inset-0 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                              style={{
                                background: 'linear-gradient(90deg, rgba(28, 156, 240, 0) 0%, rgba(28, 156, 240, 0.05) 50%, rgba(28, 156, 240, 0) 100%)',
                                boxShadow: '0 0 0 2px rgba(28, 156, 240, 0.2)',
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400 text-sm" />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-sm" style={{ color: '#f0f3f4' }}>
                          Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                              fieldState.error ? 'text-red-400' : ''
                            }`}
                            style={!fieldState.error ? { color: '#8b9299' } : {}}
                            />
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className={`pl-12 h-14 rounded-2xl transition-all duration-300 border ${
                                fieldState.error 
                                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                                  : ''
                              }`}
                              style={!fieldState.error ? {
                                background: 'rgba(240, 243, 244, 0.05)',
                                borderColor: 'rgba(240, 243, 244, 0.1)',
                                color: '#f0f3f4',
                              } : {
                                background: 'rgba(240, 243, 244, 0.05)',
                                color: '#f0f3f4',
                              }}
                              {...field}
                            />
                            <motion.div
                              className="absolute inset-0 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                              style={{
                                background: 'linear-gradient(90deg, rgba(28, 156, 240, 0) 0%, rgba(28, 156, 240, 0.05) 50%, rgba(28, 156, 240, 0) 100%)',
                                boxShadow: '0 0 0 2px rgba(28, 156, 240, 0.2)',
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400 text-sm" />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="pt-2"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onHoverStart={() => setIsHovering(true)}
                    onHoverEnd={() => setIsHovering(false)}
                  >
                    <Button
                      type="submit"
                      onClick={form.handleSubmit(onSubmit)}
                      className="w-full h-14 text-white font-semibold rounded-2xl shadow-lg relative overflow-hidden group"
                      style={{ 
                        background: '#1c9cf0',
                        boxShadow: '0 4px 24px rgba(28, 156, 240, 0.3)',
                      }}
                    >
                      <motion.div
                        className="absolute inset-0"
                        animate={{
                          opacity: isHovering ? 1 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                        style={{
                          background: 'linear-gradient(135deg, #1c9cf0 0%, #1589d6 100%)',
                        }}
                      />
                      <span className="relative flex items-center justify-center gap-2">
                        Sign In
                        <motion.div
                          animate={{ x: isHovering ? 5 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ArrowRight className="w-5 h-5" />
                        </motion.div>
                      </span>
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        initial={{ x: '-100%', skewX: -15 }}
                        animate={{ x: isHovering ? '200%' : '-100%' }}
                        transition={{ duration: 0.6 }}
                      />
                    </Button>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="text-center"
                >
                  <button
                    type="button"
                    className="text-sm transition-colors duration-200"
                    style={{ color: '#8b9299' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#1c9cf0'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#8b9299'}
                  >
                    Forgot your password?
                  </button>
                </motion.div>
              </div>
            </Form>
          </motion.div>

          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-8 flex items-center justify-center gap-2 text-sm"
            style={{ color: '#6b7280' }}
          >
            <Shield className="w-4 h-4" />
            <span>Protected by enterprise-grade encryption</span>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
      >
        <div className="absolute inset-0" style={{ background: '#1c9cf0' }}>
          {/* Animated grid overlay */}
          <motion.div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
            animate={{
              backgroundPosition: ['0px 0px', '50px 50px'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          
          {/* Floating orbs */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full backdrop-blur-sm"
              style={{
                width: Math.random() * 300 + 100,
                height: Math.random() * 300 + 100,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: 'rgba(255, 255, 255, 0.1)',
              }}
              animate={{
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12 z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-center max-w-lg"
            >
              <motion.div
                className="w-40 h-40 mx-auto mb-12 relative"
                animate={{
                  rotateY: 360,
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <div 
                  className="w-full h-full rounded-3xl flex items-center justify-center relative backdrop-blur-md shadow-2xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <Lock className="w-20 h-20" />
                  <motion.div
                    className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/0 via-white/40 to-white/0"
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>
              </motion.div>
              
              <motion.h2
                className="text-6xl font-bold mb-6"
                style={{ color: '#ffffff' }}
              >
                Secure Access
              </motion.h2>
              
              <p className="text-xl leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Experience seamless authentication with cutting-edge encryption and real-time threat protection
              </p>

              {/* Floating features */}
              <div className="mt-12 grid grid-cols-3 gap-6">
                {[
                  { icon: Shield, label: 'Protected' },
                  { icon: Lock, label: 'Encrypted' },
                  { icon: Zap, label: 'Fast' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="backdrop-blur-md rounded-2xl p-4"
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <item.icon className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm font-medium">{item.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}