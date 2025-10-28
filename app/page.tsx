import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sprout, MapPin, Activity, TrendingUp, Users, Shield } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-svh bg-gradient-to-br from-lime-50 to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/farmwise-logo-green.png" alt="Farmwise" width={240} height={80} className="w-auto h-10" />
          </Link>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild className="bg-lime-600 hover:bg-lime-700">
              <Link href="/auth/sign-up">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-lime-900 sm:text-6xl mb-6">
            Digitalize Your Farm Management
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Comprehensive agricultural platform for GPS field mapping, crop tracking, yield forecasting, and farm loan
            management. Built for farmers, cooperatives, and agro traders.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-lime-600 hover:bg-lime-700">
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/auth/login">Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-lime-900 mb-4">Powerful Features</h3>
          <p className="text-muted-foreground">Everything you need to manage your agricultural operations</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <MapPin className="h-10 w-10 text-lime-600 mb-2" />
              <CardTitle>GPS Field Mapping</CardTitle>
              <CardDescription>
                Map farm boundaries with precision GPS tracking and visualize plots on interactive maps
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Activity className="h-10 w-10 text-lime-600 mb-2" />
              <CardTitle>Activity Tracking</CardTitle>
              <CardDescription>
                Log planting, irrigation, fertilization, pest control, and harvest activities in real-time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-lime-600 mb-2" />
              <CardTitle>Yield Forecasting</CardTitle>
              <CardDescription>
                Predict crop yields with data-driven insights and optimize your farming operations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-lime-600 mb-2" />
              <CardTitle>Farmer Database</CardTitle>
              <CardDescription>
                Comprehensive farmer profiles with contact info, farm details, and verification status
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-lime-600 mb-2" />
              <CardTitle>Traceability</CardTitle>
              <CardDescription>
                Track produce from farm to market with QR codes and blockchain verification
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Sprout className="h-10 w-10 text-lime-600 mb-2" />
              <CardTitle>Loan Management</CardTitle>
              <CardDescription>
                Manage farm loans, track repayments, and assess creditworthiness with ease
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-lime-600 text-white border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-white mb-4">Ready to Transform Your Farm?</CardTitle>
            <CardDescription className="text-lime-50 text-lg">
              Join thousands of farmers using Farmwise to digitalize their agricultural operations
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/auth/sign-up">Start Free Trial</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/farmwise-logo-green.png" alt="Farmwise" width={200} height={67} className="w-auto h-14" />
            </Link>
            <p className="text-sm text-muted-foreground">© 2025 Farmwise. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
