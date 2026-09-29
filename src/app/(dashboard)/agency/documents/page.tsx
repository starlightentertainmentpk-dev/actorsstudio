"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useContracts } from "@/hooks/useContracts"
import { AgencyDocument, DocumentCategory } from "@/types/contracts"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  FolderOpen,
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  Plus,
  Shield,
  FileCheck,
  Briefcase,
  UserCheck,
  CreditCard,
  Lock,
  ArrowLeft,
  X,
  Eye,
  CheckCircle2,
} from "lucide-react"

export default function AgencyDocumentsPage() {
  const { toast } = useToast()
  const {
    documents,
    isLoadingDocuments,
    saveDocumentRecord,
    deleteDocument,
  } = useContracts()

  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Upload modal state
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>("contract")
  const [uploadIsPrivate, setUploadIsPrivate] = useState(true)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [selectedFileSize, setSelectedFileSize] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)

  // Tab definitions
  const tabs = [
    { id: "all", label: "All Files", icon: FolderOpen },
    { id: "contracts", label: "Contracts", category: "contract", icon: FileCheck },
    { id: "briefs", label: "Client Briefs", category: "production", icon: Briefcase },
    { id: "passports", label: "Tax & Passports", category: "talent_doc", icon: UserCheck },
    { id: "invoices", label: "Invoices & Finance", category: "invoice", icon: CreditCard },
  ]

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase())

    let matchesTab = true
    if (activeTab === "contracts") matchesTab = doc.category === "contract"
    else if (activeTab === "briefs") matchesTab = doc.category === "production" || doc.category === "client_doc"
    else if (activeTab === "passports") matchesTab = doc.category === "talent_doc" || doc.category === "legal"
    else if (activeTab === "invoices") matchesTab = doc.category === "invoice"

    return matchesSearch && matchesTab
  })

  // Format file size
  const formatBytes = (bytes?: number | null) => {
    if (!bytes) return "0 KB"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Handle Mock Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a document title.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const fileName = selectedFileName || `${uploadTitle.replace(/\s+/g, "_")}.pdf`
      const size = selectedFileSize || Math.floor(Math.random() * 800000) + 100000

      await saveDocumentRecord({
        title: uploadTitle.endsWith(".pdf") ? uploadTitle : `${uploadTitle}.pdf`,
        category: uploadCategory,
        fileStoragePath: `/agency_vault/${uploadCategory}/${fileName}`,
        fileSizeBytes: size,
        mimeType: "application/pdf",
        isPrivate: uploadIsPrivate,
      })

      toast({
        title: "Document Vaulted Successfully",
        description: "File encrypted with AES-256 and added to agency vault.",
      })

      setIsUploadModalOpen(false)
      setUploadTitle("")
      setSelectedFileName(null)
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to save document record.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Handle Secure Download
  const handleDownload = (doc: AgencyDocument) => {
    toast({
      title: "Generating Signed URL",
      description: `Secure 15-minute token generated for ${doc.title}. Downloading...`,
    })

    // Simulate instant download trigger
    const link = document.createElement("a")
    link.href = "#"
    link.setAttribute("download", doc.title)
    document.body.appendChild(link)
    setTimeout(() => {
      document.body.removeChild(link)
    }, 100)
  }

  const handleDelete = async (doc: AgencyDocument) => {
    if (!confirm(`Delete "${doc.title}" from document vault?`)) return

    try {
      await deleteDocument(doc.id)
      toast({
        title: "Document Removed",
        description: "File record deleted from agency storage.",
      })
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete file.",
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
              Central Agency Document Vault
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Unified confidential repository for commercial contracts, client production briefs, passports, and invoices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            className="text-xs h-9 bg-amber-600 hover:bg-amber-500 text-white font-medium"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Security & Storage Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Total Archived Files</span>
            <p className="text-xl font-bold text-foreground mt-0.5">{documents.length} Assets</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Encryption Level</span>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">AES-256 CMEK</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Access Protocol</span>
            <p className="text-xl font-bold text-indigo-400 mt-0.5">Signed URLs (15m)</p>
          </div>
        </div>
      </div>

      {/* Folder Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Folder Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isCurrent = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors whitespace-nowrap ${
                  isCurrent
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by name..."
            className="pl-9 text-xs h-9 bg-background"
          />
        </div>
      </div>

      {/* Documents Table View */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Document Title</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">File Size</th>
                <th className="py-3 px-4 font-semibold">Security</th>
                <th className="py-3 px-4 font-semibold">Uploaded By</th>
                <th className="py-3 px-4 font-semibold">Date Added</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoadingDocuments ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Accessing document vault...
                  </td>
                </tr>
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium text-foreground">No documents found in folder</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Upload production agreements, client briefs, or talent identification.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setIsUploadModalOpen(true)}
                      className="mt-4 text-xs h-8 bg-amber-600 hover:bg-amber-500 text-white"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Upload File
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-foreground max-w-[280px]">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-amber-400 shrink-0" />
                        <span className="truncate font-mono">{doc.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {doc.category}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap font-mono">
                      {formatBytes(doc.file_size_bytes)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                        <Lock className="h-3 w-3" />
                        {doc.is_private ? "Confidential" : "Shared"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                      {doc.uploader_name || "Agency Staff"}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap font-mono">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDownload(doc)}
                          className="h-8 w-8 text-muted-foreground hover:text-amber-400"
                          title="Generate Signed URL & Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDelete(doc)}
                          className="h-8 w-8 text-muted-foreground hover:text-rose-400"
                          title="Delete from Vault"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/20">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-foreground">Upload to Document Vault</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Document Title</label>
                <Input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Mahira_Khan_Model_Release_Signed"
                  className="text-xs h-9 bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                  className="w-full text-xs h-9 px-3 rounded-lg border border-border/80 bg-background text-foreground focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="contract">Commercial Contract</option>
                  <option value="production">Production / Client Brief</option>
                  <option value="talent_doc">Talent Document (Passport / ID / Comp Card)</option>
                  <option value="invoice">Invoice / Payout Statement</option>
                  <option value="legal">Corporate Legal Terms</option>
                </select>
              </div>

              {/* Dropzone mockup */}
              <div className="border-2 border-dashed border-border/80 rounded-xl p-5 text-center space-y-2 bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer">
                <input
                  type="file"
                  id="vault-file-upload"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setSelectedFileName(file.name)
                      setSelectedFileSize(file.size)
                      if (!uploadTitle) {
                        setUploadTitle(file.name.replace(/\.[^/.]+$/, ""))
                      }
                    }
                  }}
                />
                <label htmlFor="vault-file-upload" className="cursor-pointer block">
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1.5 opacity-60" />
                  <p className="text-xs font-medium text-foreground">
                    {selectedFileName || "Click to browse or drop file here"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    PDF, DOCX, PNG up to 25MB • Automated AES-256 Vault Storage
                  </p>
                </label>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={uploadIsPrivate}
                  onChange={(e) => setUploadIsPrivate(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-amber-600 focus:ring-amber-500"
                />
                <span>Private / Internal Only (Requires agency clearance)</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading || !uploadTitle.trim()}
                  className="text-xs h-9 bg-amber-600 hover:bg-amber-500 text-white font-medium"
                >
                  {isUploading ? "Uploading..." : "Save to Vault"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
