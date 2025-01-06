'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, MapPin, RotateCcw } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    // Log the 404 error
    console.log('404 error: Page not found')
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-bold">404</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Car className="w-24 h-24 mx-auto text-primary" />
          </motion.div>
          <h2 className="text-2xl font-semibold">Oops! Wrong turn.</h2>
          <p className="text-muted-foreground">
            Looks like we've taken a detour. The page you're looking for isn't on our map.
          </p>
          <motion.div
            className="flex items-center justify-center space-x-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <MapPin className="w-5 h-5 text-destructive" />
            <span className="text-destructive font-medium">Destination not found</span>
          </motion.div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => router.push('/dashboard')}
            className="w-full"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </CardFooter>
      </Card>
      <motion.p
        className="mt-8 text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        Need help? Contact our support team.
      </motion.p>
    </div>
  )
}

