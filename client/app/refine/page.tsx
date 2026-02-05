"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, HelpCircle, Loader2, AlertCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { isDemoMode, DEMO_MESSAGE } from "@/lib/demo-mode"

interface Question {
  text: string
  type: "yes_no"
}

type Answer = "yes" | "no" | "not_sure"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// Demo questions for simulation
const DEMO_QUESTIONS: Question[] = [
  { text: "Is the item primarily black in color?", type: "yes_no" },
  { text: "Does the item have any visible branding or logos?", type: "yes_no" },
  { text: "Was the item made of leather or faux leather?", type: "yes_no" },
]

export default function RefinePage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const isDemo = isDemoMode()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, Answer>>({})
  const [submitted, setSubmitted] = useState(false)
  const [inquiryDescription, setInquiryDescription] = useState("")
  const [remainingMatches, setRemainingMatches] = useState<number | null>(null)

  useEffect(() => {
    // In demo mode, use mock questions
    if (isDemo) {
      setQuestions(DEMO_QUESTIONS)
      setInquiryDescription("Black leather wallet with initials")
      setLoading(false)
      return
    }

    if (!token) {
      setError("Invalid or missing token")
      setLoading(false)
      return
    }

    fetchSession()
  }, [token, isDemo])

  const fetchSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/refine/${token}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Session not found or expired")
      }

      setQuestions(data.data.questions || [])
      setInquiryDescription(data.data.inquiry?.description || "")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (index: number, answer: Answer) => {
    setAnswers((prev) => ({ ...prev, [index]: answer }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    // In demo mode, simulate submission
    if (isDemo) {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setRemainingMatches(2)
      setSubmitted(true)
      setSubmitting(false)
      return
    }

    try {
      const formattedAnswers = questions.map((q, i) => ({
        question: q.text,
        answer: answers[i] || "not_sure",
      }))

      const res = await fetch(`${API_BASE}/api/refine/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: formattedAnswers }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      setRemainingMatches(data.remaining_close_matches)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const allAnswered =
    questions.length > 0 && questions.every((_, i) => answers[i] !== undefined)

  // Loading state
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-background text-foreground">
        <Header />
        <main className="max-w-[800px] mx-auto pt-24 px-4 md:px-6 pb-12">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading questions...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Error state
  if (error && !submitted) {
    return (
      <div className="w-full min-h-screen bg-background text-foreground">
        <Header />
        <main className="max-w-[800px] mx-auto pt-24 px-4 md:px-6 pb-12">
          <div className="max-w-xl mx-auto mt-20 text-center">
            <div className="bg-surface-1 rounded-[2.5rem] p-2 shadow-2xl">
              <div className="bg-surface-2 rounded-[2rem] p-1.5 border border-border">
                <div className="bg-surface-3 rounded-[1.75rem] border border-border-raised p-12 flex flex-col items-center">
                  <div className="bg-destructive/10 p-6 rounded-full mb-8">
                    <AlertCircle className="h-16 w-16 text-destructive" />
                  </div>
                  <h1 className="text-2xl font-bold mb-4">Session Error</h1>
                  <p className="text-muted-foreground mb-8">{error}</p>
                  <Button asChild className="rounded-full">
                    <Link href="/">Back to Home</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Success state
  if (submitted) {
    return (
      <div className="w-full min-h-screen bg-background text-foreground">
        <Header />
        <main className="max-w-[800px] mx-auto pt-24 px-4 md:px-6 pb-12">
          <div className="max-w-xl mx-auto mt-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="bg-surface-1 rounded-[2.5rem] p-2 shadow-2xl">
              <div className="bg-surface-2 rounded-[2rem] p-1.5 border border-border">
                <div className="bg-surface-3 rounded-[1.75rem] border border-border-raised p-12 flex flex-col items-center">
                  <div className="bg-primary/10 p-6 rounded-full mb-8">
                    <CheckCircle2 className="h-16 w-16 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
                  <p className="text-muted-foreground text-lg mb-4">
                    Your answers have been submitted. Our team will review the narrowed-down matches and contact you soon if we find your item.
                  </p>
                  {remainingMatches !== null && (
                    <p className="text-sm text-muted-foreground mb-8">
                      Matches remaining for review: <span className="font-semibold text-primary">{remainingMatches}</span>
                    </p>
                  )}
                  <Button asChild className="rounded-full bg-primary text-primary-foreground px-8 py-6">
                    <Link href="/">Back to Home</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Questions state
  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <Header />

      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-amber-500/90 text-amber-950 py-2 px-4 text-center text-sm font-medium backdrop-blur-sm">
          <AlertTriangle className="inline-block w-4 h-4 mr-2" />
          {DEMO_MESSAGE}
        </div>
      )}

      <main className={`max-w-[800px] mx-auto ${isDemo ? 'pt-32' : 'pt-24'} px-4 md:px-6 pb-12`}>
        <div className="bg-surface-1 rounded-[2.5rem] p-2 shadow-2xl">
          <div className="bg-surface-2 rounded-[2rem] p-1.5 border border-border">
            <div className="bg-surface-3 rounded-[1.75rem] border border-border-raised p-8 md:p-12">
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-4">
                  Help Us Find Your Item
                </h1>
                <p className="text-muted-foreground">
                  We found multiple potential matches for your lost item. Please answer these quick questions to help us narrow it down.
                </p>
                {inquiryDescription && (
                  <div className="mt-4 p-4 bg-surface-1 rounded-2xl text-left">
                    <p className="text-sm text-muted-foreground mb-1">Your item:</p>
                    <p className="text-foreground">{inquiryDescription}</p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {questions.map((q, index) => (
                  <div key={index} className="bg-surface-1 rounded-2xl p-6">
                    <p className="text-foreground font-medium mb-4">{q.text}</p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant={answers[index] === "yes" ? "default" : "outline"}
                        onClick={() => handleAnswer(index, "yes")}
                        className={`flex-1 min-w-[100px] rounded-full py-6 ${answers[index] === "yes"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "hover:border-green-600 hover:text-green-600"
                          }`}
                      >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Yes
                      </Button>
                      <Button
                        variant={answers[index] === "no" ? "default" : "outline"}
                        onClick={() => handleAnswer(index, "no")}
                        className={`flex-1 min-w-[100px] rounded-full py-6 ${answers[index] === "no"
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "hover:border-red-600 hover:text-red-600"
                          }`}
                      >
                        <XCircle className="mr-2 h-5 w-5" />
                        No
                      </Button>
                      <Button
                        variant={answers[index] === "not_sure" ? "default" : "outline"}
                        onClick={() => handleAnswer(index, "not_sure")}
                        className={`flex-1 min-w-[100px] rounded-full py-6 ${answers[index] === "not_sure"
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : "hover:border-amber-600 hover:text-amber-600"
                          }`}
                      >
                        <HelpCircle className="mr-2 h-5 w-5" />
                        Not Sure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitting}
                  className="flex-1 rounded-full bg-primary text-primary-foreground py-6 font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Answers"
                  )}
                </Button>
              </div>

              {!allAnswered && questions.length > 0 && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Please answer all {questions.length} questions to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
