// components/AuthLoader.jsx
"use client"
import { useEffect, useState } from "react"
import { Loader } from "lucide-react"

export default function AuthLoader() {
  const [showContent, setShowContent] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)

  useEffect(() => {
    // Show content after a short delay
    const contentTimer = setTimeout(() => {
      setShowContent(true)
    }, 3000)

    // Simulate loading progress
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const next = prev + Math.random() * 15
        return next >= 100 ? 100 : next
      })
    }, 400)

    return () => {
      clearTimeout(contentTimer)
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <div className={`transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'} flex flex-col items-center`}>
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader className="text-primary animate-spin" size={36} />
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-gray-700 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center" />
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-64 h-2 bg-gray-800 rounded-full mb-6 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary/40 to-primary/60 transition-all duration-300 ease-out"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>

        <h3 className="text-lg font-medium text-white mb-2">Authenticating</h3>
        <p className="text-gray-400 text-center text-sm max-w-xs">
          Please wait while we verify your credentials...
        </p>
      </div>
    </div>
  )
}