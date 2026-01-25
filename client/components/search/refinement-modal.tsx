"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, MessageSquare } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface RefinementModalProps {
  isOpen: boolean
  onClose: () => void
  onRefined: (updates: any) => void
  inquiryId: string
}

export function RefinementModal({ isOpen, onClose, onRefined, inquiryId }: RefinementModalProps) {
  const [step, setStep] = useState<"initial" | "loading" | "questions" | "processing">("initial")
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)

  const fetchQuestions = async () => {
    setStep("loading")
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch(`http://localhost:8080/api/inquiry/${inquiryId}/questions`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      const data = await res.json()

      if (!res.ok) { // Check status code first
         if (data.error === "Not enough matches to need refinement") {
             alert(data.error);
             onClose();
             return;
         }
         throw new Error(data.error || "Failed to fetch questions")
      }

      setQuestions(data.questions)
      setStep("questions")
    } catch (err: any) {
      setError(err.message)
      setStep("initial")
    }
  }

  const submitAnswers = async () => {
    setStep("processing")
    setError(null)
    
    try {
       const { data: { session } } = await supabase.auth.getSession()
       const token = session?.access_token

       const payload = {
           answers: questions.map((q, i) => ({
               question: q,
               answer: answers[i] || "Unsure"
           }))
       }

       const res = await fetch(`http://localhost:8080/api/inquiry/${inquiryId}/refine`, {
         method: "POST",
         headers: { 
             "Authorization": `Bearer ${token}`,
             "Content-Type": "application/json"
         },
         body: JSON.stringify(payload)
       })

       const data = await res.json()
       
       if (!res.ok) throw new Error(data.error || "Failed to refine matches")

       onRefined(data.updates)
       // Don't close immediately, show success or just reload
       onClose()
       
    } catch (err: any) {
        setError(err.message)
        setStep("questions")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-surface-2 border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground font-sans">Help us find your item</DialogTitle>
          <DialogDescription className="text-muted-foreground font-sans">
            We found several potential matches. Answering a few questions will help us identify which one is yours.
          </DialogDescription>
        </DialogHeader>

        {step === "initial" && (
            <div className="py-6 flex flex-col items-center">
                <Button onClick={fetchQuestions} className="bg-primary text-primary-foreground rounded-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Generate Questions
                </Button>
                {error && <p className="text-destructive text-sm mt-4">{error}</p>}
            </div>
        )}

        {step === "loading" && (
            <div className="py-12 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Analyzing potential matches...</p>
            </div>
        )}

        {step === "questions" && (
            <div className="py-4 space-y-4">
                {questions.map((q, i) => (
                    <div key={i} className="space-y-2">
                        <Label htmlFor={`q-${i}`} className="text-foreground">{q}</Label>
                        <Input 
                            id={`q-${i}`}
                            value={answers[i] || ""}
                            onChange={(e) => setAnswers({...answers, [i]: e.target.value})}
                            placeholder="Your answer..."
                            className="bg-surface-1 border-border-raised text-foreground"
                        />
                    </div>
                ))}
                {error && <p className="text-destructive text-sm">{error}</p>}
                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={onClose} className="rounded-full border-border">Cancel</Button>
                    <Button onClick={submitAnswers} className="rounded-full bg-primary text-primary-foreground">
                        Submit Answers
                    </Button>
                </DialogFooter>
            </div>
        )}
        
        {step === "processing" && (
            <div className="py-12 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Re-ranking matches verified by your answers...</p>
            </div>
        )}

      </DialogContent>
    </Dialog>
  )
}
