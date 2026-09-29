"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useContracts } from "@/hooks/useContracts"
import { ContractTemplate, ContractType } from "@/types/contracts"
import { AVAILABLE_MERGE_TOKENS } from "@/lib/contracts/merge-engine"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Plus,
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  Save,
  Trash2,
  Layers,
  Code,
  Eye,
  CheckCircle2,
} from "lucide-react"

export default function ContractTemplatesPage() {
  const { toast } = useToast()
  const {
    templates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    isCreatingTemplate,
    isUpdatingTemplate,
  } = useContracts()

  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(
    templates[0] || null
  )
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // Editor form state
  const [formName, setFormName] = useState(templates[0]?.template_name || "")
  const [formType, setFormType] = useState<string>(
    templates[0]?.contract_type || "booking"
  )
  const [formBody, setFormBody] = useState(templates[0]?.body_markdown || "")
  const [formIsDefault, setFormIsDefault] = useState(templates[0]?.is_default || false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")

  // Switch selected template
  const handleSelectTemplate = (t: ContractTemplate) => {
    setSelectedTemplate(t)
    setIsCreatingNew(false)
    setFormName(t.template_name)
    setFormType(t.contract_type)
    setFormBody(t.body_markdown)
    setFormIsDefault(t.is_default)
  }

  const handleStartNew = () => {
    setSelectedTemplate(null)
    setIsCreatingNew(true)
    setFormName("New Legal Agreement Template")
    setFormType("booking")
    setFormBody(`# STANDARD AGREEMENT\n\nThis Agreement is made between **{{client_name}}** and **{{talent_name}}**, represented by **{{agency_name}}**.\n\n### Terms\n- Compensation: {{fee}}\n- Shoot Dates: {{shoot_dates}}\n- Territory: {{territory}}`)
    setFormIsDefault(false)
  }

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)

    toast({
      title: "Token Copied",
      description: `${token} copied to clipboard. Paste into your template body.`,
    })
  }

  const handleInsertToken = (token: string) => {
    setFormBody((prev) => prev + " " + token)
    toast({
      title: "Token Appended",
      description: `Appended ${token} to template.`,
    })
  }

  const handleSave = async () => {
    if (!formName.trim() || !formBody.trim()) {
      toast({
        title: "Validation Error",
        description: "Template name and body markdown are required.",
        variant: "destructive",
      })
      return
    }

    try {
      if (isCreatingNew) {
        await createTemplate({
          templateName: formName,
          contractType: formType,
          bodyMarkdown: formBody,
          isDefault: formIsDefault,
        })
        toast({
          title: "Template Created",
          description: "New contract template added to agency registry.",
        })
        setIsCreatingNew(false)
      } else if (selectedTemplate) {
        await updateTemplate({
          templateId: selectedTemplate.id,
          templateName: formName,
          contractType: formType,
          bodyMarkdown: formBody,
          isDefault: formIsDefault,
        })
        toast({
          title: "Template Saved",
          description: "Changes updated across future contract generations.",
        })
      }
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Could not save template.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedTemplate) return
    if (!confirm(`Are you sure you want to delete "${selectedTemplate.template_name}"?`)) {
      return
    }

    try {
      await deleteTemplate(selectedTemplate.id)
      toast({
        title: "Template Deleted",
        description: "Template removed from system.",
      })
      if (templates.length > 1) {
        const next = templates.find((t) => t.id !== selectedTemplate.id)
        if (next) handleSelectTemplate(next)
      } else {
        handleStartNew()
      }
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Could not delete template.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/agency/contracts">
            <Button variant="ghost" size="icon-sm" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">
              Contract Template Studio
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Build dynamic markdown agreements with smart placeholder tokens that compile on demand.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleStartNew}
            variant="outline"
            className="text-xs h-9"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Template
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isCreatingTemplate || isUpdatingTemplate}
            className="text-xs h-9 bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isCreatingTemplate || isUpdatingTemplate ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </div>

      {/* Main Grid: Sidebar List + Editor + Cheat Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Templates List Sidebar (3 cols) */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Template Registry ({templates.length})
            </span>
          </div>

          <div className="space-y-2">
            {templates.map((t) => {
              const isSelected = selectedTemplate?.id === t.id && !isCreatingNew
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/10 shadow-xs"
                      : "border-border/70 bg-card hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground line-clamp-1">
                      {t.template_name}
                    </span>
                    {t.is_default && (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[9px] px-1 py-0 uppercase">
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                    <span className="capitalize">{t.contract_type}</span>
                    <span>{t.merge_fields_json?.length || 0} tokens</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Editor Area (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Metadata Controls */}
          <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Template Name
                </label>
                <Input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Standard Model Release"
                  className="text-xs h-9 bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Contract Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full text-xs h-9 px-3 rounded-lg border border-border/80 bg-background text-foreground focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="booking">Booking / Commercial Appearance</option>
                  <option value="representation">Exclusive Representation</option>
                  <option value="model_release">Model Release</option>
                  <option value="nda">Non-Disclosure Agreement (NDA)</option>
                  <option value="usage_rights">Usage Rights Addendum</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-indigo-600 focus:ring-indigo-500"
                />
                <span>Set as default template for this contract type</span>
              </label>

              {selectedTemplate && !isCreatingNew && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Markdown Editor Tabs */}
          <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/20">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                    activeTab === "edit"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  Markdown Code
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                    activeTab === "preview"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Rendered Preview
                </button>
              </div>

              <span className="text-[11px] text-muted-foreground font-mono">
                {formBody.length} characters
              </span>
            </div>

            {activeTab === "edit" ? (
              <div className="p-4 bg-background">
                <Textarea
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  rows={20}
                  placeholder="Enter markdown template text with {{tokens}}..."
                  className="w-full font-mono text-xs leading-relaxed bg-background/50 border-0 focus-visible:ring-0 p-0 resize-y min-h-[360px]"
                />
              </div>
            ) : (
              <div className="p-6 bg-background/80 min-h-[360px] max-h-[500px] overflow-y-auto text-xs whitespace-pre-wrap font-sans text-foreground/90 leading-relaxed shadow-inner">
                {formBody}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Tokens Cheat Sheet (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Dynamic Merge Variables
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-2 shadow-xs max-h-[640px] overflow-y-auto">
            <p className="text-[11px] text-muted-foreground leading-normal">
              Click any token below to copy it or append it directly to your template markdown.
            </p>

            <div className="space-y-2 pt-1">
              {AVAILABLE_MERGE_TOKENS.map((item) => (
                <div
                  key={item.token}
                  className="p-2.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      {item.token}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopyToken(item.token)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Copy token to clipboard"
                      >
                        {copiedToken === item.token ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertToken(item.token)}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 font-medium"
                      >
                        Insert
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] font-medium text-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.description}</p>
                  <span className="text-[10px] text-muted-foreground/75 font-mono block">
                    e.g. &quot;{item.example}&quot;
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
