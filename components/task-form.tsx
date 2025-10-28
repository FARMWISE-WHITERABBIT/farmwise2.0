"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface TaskFormProps {
  currentUser: any
  farmers: Array<{ id: string; first_name: string; last_name: string }>
  agents: Array<{ id: string; first_name: string; last_name: string }>
}

export function TaskForm({ currentUser, farmers, agents }: TaskFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    farmer_id: "",
    assigned_to_agent: "",
    priority: "medium",
    due_date: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("[v0] Creating task:", formData)

      const { data, error } = await supabase
        .from("farmer_tasks")
        .insert([
          {
            ...formData,
            assigned_by: currentUser.id,
            organization_id: currentUser.organization_id,
            status: "pending",
            assigned_to_agent: formData.assigned_to_agent || null,
            due_date: formData.due_date || null,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("[v0] Task creation error:", error)
        throw error
      }

      console.log("[v0] Task created successfully:", data)

      toast({
        title: "Success",
        description: "Task created successfully",
      })

      router.push("/dashboard/tasks")
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Task creation error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="rounded-[25px] border-none shadow-sm max-w-3xl">
        <CardHeader>
          <CardTitle className="font-poppins text-xl">Task Details</CardTitle>
          <CardDescription className="font-inter">Enter the task information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-inter text-sm">
              Task Title *
            </Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              placeholder="e.g., Apply fertilizer to maize field"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-inter text-sm">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              rows={4}
              placeholder="Provide detailed instructions for the task..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="farmer_id" className="font-inter text-sm">
                Assign to Farmer *
              </Label>
              <Select
                required
                value={formData.farmer_id}
                onValueChange={(value) => setFormData({ ...formData, farmer_id: value })}
              >
                <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter">
                  <SelectValue placeholder="Select farmer" />
                </SelectTrigger>
                <SelectContent>
                  {farmers.map((farmer) => (
                    <SelectItem key={farmer.id} value={farmer.id}>
                      {farmer.first_name} {farmer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to_agent" className="font-inter text-sm">
                Assign to Extension Agent
              </Label>
              <Select
                value={formData.assigned_to_agent}
                onValueChange={(value) => setFormData({ ...formData, assigned_to_agent: value })}
              >
                <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter">
                  <SelectValue placeholder="Select agent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.first_name} {agent.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="priority" className="font-inter text-sm">
                Priority
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date" className="font-inter text-sm">
                Due Date
              </Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="rounded-[10px] border-[rgba(0,0,0,0.12)] font-inter"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] font-inter"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
