"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertCircle, Clock, TrendingUp } from "lucide-react"

// Mock data
const deliveryData = [
  { date: "Mon", whatsapp: 1240, email: 400, voice: 240 },
  { date: "Tue", whatsapp: 1221, email: 360, voice: 221 },
  { date: "Wed", whatsapp: 1229, email: 200, voice: 229 },
  { date: "Thu", whatsapp: 2000, email: 278, voice: 200 },
  { date: "Fri", whatsapp: 2181, email: 189, voice: 218 },
  { date: "Sat", whatsapp: 2500, email: 239, voice: 250 },
  { date: "Sun", whatsapp: 2100, email: 349, voice: 210 },
]

const workflowStatus = [
  { name: "Onboarding", value: 45, fill: "#6366f1" },
  { name: "Salary Reminders", value: 30, fill: "#3b82f6" },
  { name: "Document Collection", value: 15, fill: "#06b6d4" },
  { name: "Insurance Queries", value: 10, fill: "#8b5cf6" },
]

export function Dashboard() {
  const [stats, setStats] = useState({
    total_users: 0,
    total_notifications: 0,
    notifications_sent: 0,
    notifications_failed: 0,
    total_conversations: 0,
    active_workflows: 0,
    escalations: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        console.log("[v0] Fetching analytics...")
        const response = await fetch("/api/analytics")
        const data = await response.json()
        console.log("[v0] Analytics received:", data)
        setStats(data)
      } catch (error) {
        console.error("[v0] Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
    // Refresh analytics every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [])

  const statsCards = [
    { label: "Total Users", value: stats.total_users, icon: CheckCircle2, color: "bg-emerald-500/10" },
    { label: "Notifications Sent", value: stats.notifications_sent, icon: Clock, color: "bg-yellow-500/10" },
    { label: "Failed", value: stats.notifications_failed, icon: AlertCircle, color: "bg-red-500/10" },
    { label: "Conversations", value: stats.total_conversations, icon: TrendingUp, color: "bg-blue-500/10" },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-foreground">{loading ? "..." : stat.value}</div>
                  <div className={`rounded-lg p-2 ${stat.color}`}>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Notification Delivery Trends</CardTitle>
            <CardDescription>Last 7 days across all channels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={deliveryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="whatsapp" stroke="#3b82f6" dot={false} />
                <Line type="monotone" dataKey="email" stroke="#06b6d4" dot={false} />
                <Line type="monotone" dataKey="voice" stroke="#8b5cf6" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Workflow Distribution</CardTitle>
            <CardDescription>Active workflows by type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={workflowStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                  {workflowStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {workflowStatus.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Channel Performance</CardTitle>
          <CardDescription>Delivery success rates by channel</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deliveryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                }}
              />
              <Legend />
              <Bar dataKey="whatsapp" stackId="a" fill="#3b82f6" />
              <Bar dataKey="email" stackId="a" fill="#06b6d4" />
              <Bar dataKey="voice" stackId="a" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
