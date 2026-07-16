"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Search, SlidersHorizontal, ChevronDown, ChevronRight, Check, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CategoryNode } from "@/lib/categories"
import { TalentSearchParams } from "@/lib/talent-search"

const PAKISTAN_CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar", 
  "Quetta", "Faisalabad", "Multan", "Sialkot", "Gujranwala", 
  "Hyderabad", "Sargodha", "Bahawalpur", "Sukkur"
]

const LANGUAGES_LIST = [
  "Urdu", "English", "Punjabi", "Sindhi", "Pashto", "Balochi", "Saraiki", "Hindko"
]

const POPULAR_SKILLS = [
  "Acting", "Modeling", "Dancing", "Singing", "Voice Over", 
  "Stunts", "Monologues", "Public Speaking", "Accents", "Improv", 
  "Martial Arts", "Swimming", "Screenwriting", "Theatre"
]

interface TalentFilterSidebarProps {
  defaultValues: TalentSearchParams
  categories: CategoryNode[]
  onCloseMobile?: () => void
}

export function TalentFilterSidebar({ defaultValues, categories, onCloseMobile }: TalentFilterSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Local filter states
  const [searchText, setSearchText] = useState(defaultValues.q || "")
  const [selectedCategory, setSelectedCategory] = useState(defaultValues.category || "")
  const [selectedCity, setSelectedCity] = useState(defaultValues.city || "")
  const [selectedGender, setSelectedGender] = useState(defaultValues.gender || "")
  
  // Age inputs
  const [ageMin, setAgeMin] = useState<string>(defaultValues.age_min ? String(defaultValues.age_min) : "")
  const [ageMax, setAgeMax] = useState<string>(defaultValues.age_max ? String(defaultValues.age_max) : "")

  // Array states
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(defaultValues.languages || [])
  const [selectedSkills, setSelectedSkills] = useState<string[]>(defaultValues.skills || [])
  
  // Experience select
  const [expMin, setExpMin] = useState<string>(defaultValues.exp_min ? String(defaultValues.exp_min) : "")

  // Boolean toggles
  const [availableOnly, setAvailableOnly] = useState(defaultValues.available || false)
  const [premiumOnly, setPremiumOnly] = useState(defaultValues.premium || false)

  // Accordion UI state (expanded category IDs)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  // Debounced search text state
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchText !== (defaultValues.q || "")) {
        applyFilters({ qText: searchText })
      }
    }, 400)
    return () => clearTimeout(handler)
  }, [searchText])

  // Sync state with URL params when they change
  useEffect(() => {
    setSearchText(defaultValues.q || "")
    setSelectedCategory(defaultValues.category || "")
    setSelectedCity(defaultValues.city || "")
    setSelectedGender(defaultValues.gender || "")
    setAgeMin(defaultValues.age_min ? String(defaultValues.age_min) : "")
    setAgeMax(defaultValues.age_max ? String(defaultValues.age_max) : "")
    setSelectedLanguages(defaultValues.languages || [])
    setSelectedSkills(defaultValues.skills || [])
    setExpMin(defaultValues.exp_min ? String(defaultValues.exp_min) : "")
    setAvailableOnly(defaultValues.available || false)
    setPremiumOnly(defaultValues.premium || false)
  }, [defaultValues])

  const toggleCategoryExpand = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
  }

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  // Construct and push updated URL search params
  const applyFilters = (overrides?: { qText?: string }) => {
    const query = new URLSearchParams()
    
    // Apply debounce override or current local state
    const qValue = overrides && overrides.qText !== undefined ? overrides.qText : searchText
    if (qValue.trim()) query.set("q", qValue.trim())
    
    if (selectedCategory) query.set("category", selectedCategory)
    if (selectedCity) query.set("city", selectedCity)
    if (selectedGender) query.set("gender", selectedGender)
    
    if (ageMin) query.set("age_min", ageMin)
    if (ageMax) query.set("age_max", ageMax)
    if (expMin) query.set("exp_min", expMin)
    
    if (availableOnly) query.set("available", "true")
    if (premiumOnly) query.set("premium", "true")

    selectedLanguages.forEach(lang => query.append("languages", lang))
    selectedSkills.forEach(skill => query.append("skills", skill))

    // Always reset to page 1 on filter changes
    query.set("page", "1")

    router.push(`${pathname}?${query.toString()}`)
    if (onCloseMobile) onCloseMobile()
  }

  const handleReset = () => {
    setSearchText("")
    setSelectedCategory("")
    setSelectedCity("")
    setSelectedGender("")
    setAgeMin("")
    setAgeMax("")
    setSelectedLanguages([])
    setSelectedSkills([])
    setExpMin("")
    setAvailableOnly(false)
    setPremiumOnly(false)
    
    router.push(pathname)
    if (onCloseMobile) onCloseMobile()
  }

  return (
    <div className="flex flex-col gap-6 bg-card border border-border/60 rounded-3xl p-5 md:p-6 shadow-sm overflow-y-auto max-h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-brand-500" /> Filters
        </h2>
        <Button 
          variant="ghost" 
          size="xs" 
          onClick={handleReset}
          className="text-muted-foreground hover:text-brand-500 font-semibold flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" /> Reset
        </Button>
      </div>

      {/* Text Search Box */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search Keyword</label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Name, skills, bio..."
            className="w-full bg-muted/30 border border-border/60 rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 outline-none transition-all"
          />
          {searchText && (
            <button 
              onClick={() => { setSearchText(""); applyFilters({ qText: "" }) }} 
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Accordion */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Categories</label>
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug
            const isExpanded = !!expandedCategories[cat.id]
            const hasChildren = cat.children && cat.children.length > 0

            return (
              <div key={cat.id} className="space-y-1">
                <div className="flex items-center justify-between group">
                  <label className="flex items-center gap-2 text-sm text-foreground font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={isSelected}
                      onChange={() => setSelectedCategory(isSelected ? "" : cat.slug)}
                      className="h-4 w-4 rounded-full text-brand-500 border-border/60 focus:ring-brand-500 cursor-pointer accent-brand-500"
                    />
                    <span className={isSelected ? "text-brand-500 font-bold" : "text-muted-foreground group-hover:text-foreground transition-colors"}>
                      {cat.name}
                    </span>
                  </label>
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => toggleCategoryExpand(cat.id)}
                      className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted/50 cursor-pointer"
                    >
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>

                {/* Subcategories */}
                {hasChildren && isExpanded && (
                  <div className="pl-6 pt-1 pb-1 space-y-1.5 border-l border-border/40 ml-2">
                    {cat.children.map((sub) => {
                      const isSubSelected = selectedCategory === sub.slug
                      return (
                        <label key={sub.id} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                          <input
                            type="radio"
                            name="category"
                            checked={isSubSelected}
                            onChange={() => setSelectedCategory(isSubSelected ? "" : sub.slug)}
                            className="h-3.5 w-3.5 rounded-full text-brand-500 border-border/60 focus:ring-brand-500 cursor-pointer accent-brand-500"
                          />
                          <span className={isSubSelected ? "text-brand-500 font-bold" : ""}>
                            {sub.name}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Location Dropdown */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Location (City)</label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full bg-card border border-border/60 rounded-xl px-3 py-2 text-sm text-foreground focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 outline-none transition-all cursor-pointer"
        >
          <option value="">Any Pakistan City</option>
          {PAKISTAN_CITIES.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Gender Radios */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Gender</label>
        <div className="flex gap-4">
          {["", "male", "female"].map((g) => (
            <label key={g} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              <input
                type="radio"
                name="gender"
                checked={selectedGender === g}
                onChange={() => setSelectedGender(g)}
                className="h-4 w-4 text-brand-500 border-border/60 focus:ring-brand-500 cursor-pointer accent-brand-500"
              />
              <span className={selectedGender === g ? "text-brand-500 font-semibold" : ""}>
                {g === "" ? "Any" : g.charAt(0).toUpperCase() + g.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Age Inputs */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Age Range</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="120"
            placeholder="Min"
            value={ageMin}
            onChange={(e) => setAgeMin(e.target.value)}
            className="w-full bg-muted/30 border border-border/60 rounded-xl px-3 py-1.5 text-sm text-foreground text-center focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
          />
          <span className="text-muted-foreground text-xs">—</span>
          <input
            type="number"
            min="0"
            max="120"
            placeholder="Max"
            value={ageMax}
            onChange={(e) => setAgeMax(e.target.value)}
            className="w-full bg-muted/30 border border-border/60 rounded-xl px-3 py-1.5 text-sm text-foreground text-center focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Experience select */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Min Experience</label>
        <select
          value={expMin}
          onChange={(e) => setExpMin(e.target.value)}
          className="w-full bg-card border border-border/60 rounded-xl px-3 py-2 text-sm text-foreground focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 outline-none transition-all cursor-pointer"
        >
          <option value="">Any Experience</option>
          <option value="0">Show all (0+ years)</option>
          <option value="2">2+ years</option>
          <option value="5">5+ years</option>
          <option value="10">10+ years</option>
        </select>
      </div>

      {/* Languages Checkboxes */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Languages</label>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
          {LANGUAGES_LIST.map((lang) => {
            const isChecked = selectedLanguages.includes(lang)
            return (
              <label key={lang} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleLanguage(lang)}
                  className="h-3.5 w-3.5 rounded border-border/60 text-brand-500 focus:ring-brand-500 cursor-pointer accent-brand-500"
                />
                <span className={isChecked ? "text-brand-500 font-semibold" : ""}>{lang}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Popular Skills (Chips selector) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Popular Skills</label>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
          {POPULAR_SKILLS.map((skill) => {
            const isSelected = selectedSkills.includes(skill)
            return (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-brand-500 text-white border-brand-500 shadow-sm"
                    : "bg-muted/20 text-muted-foreground border-border/60 hover:border-muted-foreground/30 hover:text-foreground"
                }`}
              >
                {skill}
              </button>
            )
          })}
        </div>
      </div>

      {/* Availability & Premium Toggles */}
      <div className="border-t border-border/40 pt-4 space-y-3">
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors font-medium">Available Only</span>
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            className="h-4 w-4 rounded border-border/60 text-brand-500 focus:ring-brand-500 cursor-pointer accent-brand-500"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors font-medium">Premium Talent Only</span>
          <input
            type="checkbox"
            checked={premiumOnly}
            onChange={(e) => setPremiumOnly(e.target.checked)}
            className="h-4 w-4 rounded border-border/60 text-brand-500 focus:ring-brand-500 cursor-pointer accent-brand-500"
          />
        </label>
      </div>

      {/* Apply / Reset Actions */}
      <div className="flex gap-2 sticky bottom-0 bg-card pt-2 border-t border-border/30">
        <Button 
          type="button" 
          onClick={handleReset} 
          variant="outline" 
          className="flex-1 rounded-xl h-9 text-xs font-bold cursor-pointer"
        >
          Reset
        </Button>
        <Button 
          type="button" 
          onClick={() => applyFilters()} 
          className="flex-1 bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-500/10 rounded-xl h-9 text-xs font-bold cursor-pointer"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  )
}
