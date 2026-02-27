import { z } from 'zod'

export const emailSchema = z.string().trim().email()

export const volunteerSchema = z.object({
  id: z.string().min(1),
  firstname: z.string().trim().min(1),
  lastname: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim(),
  groups: z.array(z.string()),
  notes: z.string().trim()
})

export const groupSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1)
})

export const storageSchema = z.object({
  volunteers: z.array(volunteerSchema),
  groups: z.array(groupSchema)
})

export const csvRowSchema = z.object({
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  groups: z.string().optional(),
  notes: z.string().optional()
})

export const volunteerFormSchema = z.object({
  firstname: z.string().trim().min(1),
  lastname: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  groups: z.array(z.string()).default([])
})

export const groupFormSchema = z.object({
  name: z.string().trim().min(1)
})
