'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  steps: string[]
  current: number
}

export function ProgressBar({ steps, current }: ProgressBarProps) {
  return (
    <div className="w-full py-4 mb-8">
      <div className="relative flex items-center justify-between">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-muted dark:bg-muted/40" />

        {/* Progress Line */}
        <motion.div
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-brand-500"
          initial={{ width: '0%' }}
          animate={{
            width: `${((current - 1) / (steps.length - 1)) * 100}%`,
          }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />

        {/* Steps */}
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = current > stepNumber
          const isActive = current === stepNumber

          return (
            <div key={step} className="relative z-10 flex flex-col items-center">
              <motion.div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors duration-300",
                  isCompleted
                    ? "border-brand-500 bg-brand-500 text-white"
                    : isActive
                    ? "border-brand-500 bg-card text-brand-500 shadow-md shadow-brand-500/20"
                    : "border-muted bg-card text-muted-foreground"
                )}
                initial={false}
                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  >
                    <Check className="h-5 w-5 stroke-[3]" />
                  </motion.div>
                ) : (
                  <span>{stepNumber}</span>
                )}
              </motion.div>
              <span
                className={cn(
                  "absolute top-12 whitespace-nowrap text-xs font-medium transition-colors duration-300",
                  isActive
                    ? "text-brand-500 dark:text-brand-400 font-semibold"
                    : isCompleted
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
