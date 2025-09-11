"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, Download } from "lucide-react"

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: any, item: T) => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchKey?: keyof T
  title?: string
  onAdd?: () => void
  addButtonText?: string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchKey,
  title,
  onAdd,
  addButtonText = "Add New",
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = searchKey
    ? data.filter((item) => String(item[searchKey]).toLowerCase().includes(searchTerm.toLowerCase()))
    : data

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>{title && <h2 className="text-2xl font-bold text-foreground">{title}</h2>}</div>
        <div className="flex items-center gap-3">
          {searchKey && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          )}
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          {onAdd && (
            <Button onClick={onAdd} className="gap-2">
              <span className="text-lg">+</span>
              {addButtonText}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              {columns.map((column) => (
                <TableHead key={String(column.key)} className="font-semibold text-foreground">
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-border hover:bg-muted/50 transition-colors"
                >
                  {columns.map((column) => (
                    <TableCell key={String(column.key)} className="text-foreground">
                      {column.render ? column.render(item[column.key], item) : String(item[column.key])}
                    </TableCell>
                  ))}
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}
