import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { removeBackground } from "@imgly/background-removal";
import {
  AlignCenter, AlignLeft, AlignRight,
  ImagePlus, Link as LinkIcon, Minus, Plus, Type,
  Eye, Trash2, ChevronUp, ChevronDown,
  Save, LayoutTemplate, GripVertical, Check,
  CreditCard, X, Pencil, Maximize2,
  Italic as ItalicIcon, Phone, Mail, Globe, MapPin,
  MessageCircle, Share2, QrCode, UserPlus, Copy,
  Download, Instagram, Twitter, Linkedin, Youtube,
  Clock, Star, Briefcase, Camera, Send,
  Bookmark, BookmarkCheck, CircleIcon, Sparkles,
  Search, Image as ImageIcon, Wand2, Undo2, Redo2, Upload,
} from "lucide-react";
import { useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Canvas ──────────────────────────────────────────────────────────────────
const CANVAS_W = 390;
const CANVAS_H = 700;

// ─── Icon map for icon_row rendering ─────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Phone, Mail, Globe, MapPin, MessageCircle, Linkedin, Twitter, Instagram, Youtube, Clock, Send, Star,
};

// ─── Types ───────────────────────────────────────────────────────────────────
type ElementType = "text" | "button" | "link" | "image" | "divider" | "shape" | "icon_row";

type CanvasElement = {
  id: string; type: ElementType;
  x: number; y: number; w: number; h: number;
  text?: string; href?: string; src?: string;
  fontSize: number; color: string;
  align: "left" | "center" | "right";
  fontWeight: 400 | 500 | 600 | 700 | 800 | 900;
  background: string; radius: number; padding: number;
  opacity: number; italic: boolean; locked: boolean; hidden: boolean;
  shadowColor: string; shadowBlur: number; zIndex: number; letterSpacing: number;
  iconName?: string; iconColor?: string;
};

type CanvasBackground = { type: "solid" | "gradient"; color: string; gradient: string; imageUrl: string; };

// ─── Templates ───────────────────────────────────────────────────────────────
const TEMPLATES: {
  id: string; name: string; category: string; thumb: string; accentColor: string;
  bg: CanvasBackground; elements: Partial<CanvasElement>[];
}[] = [
  // ── Artemis ───────────────────────────────────────────────────────────────
  {
    id: "artemis",
    name: "Artemis",
    category: "Dark",
    accentColor: "#f59e0b",
    thumb: "#1a1c22",
    bg: { type: "solid", color: "#1a1c2f", gradient: "", imageUrl: "" },
    elements: [
      { type: "shape",    x: 0,   y: 0,   w: 80,  h: 700, background: "#23262f", radius: 0,  color: "transparent" },
      { type: "shape",    x: 0,   y: 0,   w: 80,  h: 4,   background: "#f59e0b", radius: 0,  color: "transparent" },
      { type: "shape",    x: 20,  y: 30,  w: 40,  h: 40,  background: "#f59e0b", radius: 6,  color: "transparent" },
      { type: "text",     x: 22,  y: 38,  w: 36,  h: 24,  text: "A",            fontSize: 18, fontWeight: 800, color: "#1a1c22", align: "center" },
      { type: "text",     x: 17,  y: 80,  w: 46,  h: 16,  text: "ARTEMIS",      fontSize: 7,  fontWeight: 700, color: "#f59e0b", align: "center", letterSpacing: 1 },
      { type: "text",     x: 17,  y: 96,  w: 46,  h: 14,  text: "Graphic",      fontSize: 7,  fontWeight: 400, color: "#888888", align: "center" },
      { type: "text",     x: 17,  y: 110, w: 46,  h: 14,  text: "Designer",     fontSize: 7,  fontWeight: 400, color: "#888888", align: "center" },
      { type: "image",    x: 210, y: 28,  w: 110, h: 130, radius: 8,  src: "" },
      { type: "text",     x: 100, y: 30,  w: 106, h: 44,  text: "JHONSON SMITH", fontSize: 20, fontWeight: 800, color: "#ffffff", align: "left", letterSpacing: 1 },
      { type: "text",     x: 100, y: 76,  w: 106, h: 20,  text: "Graphic Designer", fontSize: 11, fontWeight: 400, color: "#f59e0b", align: "left" },
      { type: "divider",  x: 100, y: 106, w: 268, h: 1,   background: "rgba(245,158,11,0.25)", color: "transparent" },
      { type: "icon_row", x: 100, y: 116, w: 268, h: 40,  text: "00 123 465 789",       iconName: "Phone",  iconColor: "#22c55e", background: "rgba(34,197,94,0.08)",  color: "#d1d5db", radius: 8, fontSize: 12, fontWeight: 400 },
      { type: "icon_row", x: 100, y: 162, w: 268, h: 40,  text: "username@gmail.com",   iconName: "Mail",   iconColor: "#3b82f6", background: "rgba(59,130,246,0.08)", color: "#d1d5db", radius: 8, fontSize: 12, fontWeight: 400 },
      { type: "icon_row", x: 100, y: 208, w: 268, h: 40,  text: "www.creativelab.com",  iconName: "Globe",  iconColor: "#06b6d4", background: "rgba(6,182,212,0.08)",  color: "#d1d5db", radius: 8, fontSize: 12, fontWeight: 400 },
      { type: "icon_row", x: 100, y: 254, w: 268, h: 40,  text: "777 Seventh Ave, NY",  iconName: "MapPin", iconColor: "#f59e0b", background: "rgba(245,158,11,0.08)", color: "#d1d5db", radius: 8, fontSize: 12, fontWeight: 400 },
      { type: "button",   x: 100, y: 308, w: 200, h: 42,  text: "Save Contact",    background: "#f59e0b",                color: "#1a1c22", radius: 10, fontSize: 13, fontWeight: 700 },
      { type: "button",   x: 100, y: 356, w: 200, h: 40,  text: "Share My Contact", background: "rgba(245,158,11,0.12)",  color: "#f59e0b", radius: 10, fontSize: 12, fontWeight: 600 },
    ],
  },
  // ── Obsidian ──────────────────────────────────────────────────────────────
  {
    id: "obsidian",
    name: "Obsidian",
    category: "Dark",
    accentColor: "#ffffff",
    thumb: "#111111",
    bg: { type: "solid", color: "#111111", gradient: "", imageUrl: "" },
    elements: [
      { type: "shape",    x: 0,   y: 0,   w: 390, h: 220, background: "#1a1a1a", radius: 0, color: "transparent" },
      { type: "divider",  x: 32,  y: 224, w: 3,   h: 80,  background: "#ffffff", color: "transparent", radius: 0 },
      { type: "text",     x: 48,  y: 56,  w: 300, h: 52,  text: "YOUR",     fontSize: 44, fontWeight: 900, color: "#ffffff", align: "left", letterSpacing: 6 },
      { type: "text",     x: 48,  y: 106, w: 300, h: 52,  text: "COMPANY",  fontSize: 44, fontWeight: 900, color: "#ffffff", align: "left", letterSpacing: 6 },
      { type: "text",     x: 48,  y: 162, w: 300, h: 24,  text: "YOUR TAGLINE HERE", fontSize: 11, fontWeight: 400, color: "#555555", align: "left", letterSpacing: 3 },
      { type: "text",     x: 200, y: 44,  w: 160, h: 46,  text: "DAVIS",    fontSize: 34, fontWeight: 900, color: "#ffffff", align: "right", letterSpacing: 2 },
      { type: "text",     x: 200, y: 88,  w: 160, h: 46,  text: "FERGUSON", fontSize: 34, fontWeight: 900, color: "#ffffff", align: "right", letterSpacing: 2 },
      { type: "text",     x: 200, y: 142, w: 160, h: 22,  text: "ART DIRECTOR", fontSize: 11, fontWeight: 400, color: "#555555", align: "right", letterSpacing: 3 },
      { type: "divider",  x: 48,  y: 316, w: 310, h: 1,   background: "rgba(255,255,255,0.07)", color: "transparent" },
      { type: "icon_row", x: 48,  y: 326, w: 310, h: 40,  text: "010 020 030 040",        iconName: "Phone",  iconColor: "#ffffff", background: "rgba(255,255,255,0.05)", color: "#888888", radius: 8, fontSize: 13, fontWeight: 400 },
      { type: "icon_row", x: 48,  y: 372, w: 310, h: 40,  text: "contact@email.com",       iconName: "Mail",   iconColor: "#ffffff", background: "rgba(255,255,255,0.05)", color: "#888888", radius: 8, fontSize: 13, fontWeight: 400 },
      { type: "icon_row", x: 48,  y: 418, w: 310, h: 40,  text: "www.website.com",         iconName: "Globe",  iconColor: "#ffffff", background: "rgba(255,255,255,0.05)", color: "#888888", radius: 8, fontSize: 13, fontWeight: 400 },
      { type: "icon_row", x: 48,  y: 464, w: 310, h: 40,  text: "Your address, lorem ipsum", iconName: "MapPin", iconColor: "#ffffff", background: "rgba(255,255,255,0.05)", color: "#555555", radius: 8, fontSize: 13, fontWeight: 400 },
      { type: "button",   x: 48,  y: 520, w: 294, h: 44,  text: "Save Contact",    background: "#ffffff",                color: "#111111", radius: 10, fontSize: 13, fontWeight: 700 },
      { type: "button",   x: 48,  y: 570, w: 294, h: 42,  text: "Share My Contact", background: "rgba(255,255,255,0.07)", color: "#bbbbbb", radius: 10, fontSize: 12, fontWeight: 600 },
    ],
  },
  // ── Forest ────────────────────────────────────────────────────────────────
  {
    id: "forest",
    name: "Forest",
    category: "Dark",
    accentColor: "#86efac",
    thumb: "#3a5a2e",
    bg: { type: "solid", color: "#3a5a2e", gradient: "", imageUrl: "" },
    elements: [
      { type: "shape",    x: 0,   y: 0,   w: 390, h: 380, background: "#2d4a22", radius: 0, color: "transparent" },
      { type: "image",    x: 32,  y: 32,  w: 44,  h: 44,  radius: 8,  src: "" },
      { type: "text",     x: 84,  y: 40,  w: 200, h: 20,  text: "WARDIERE",       fontSize: 13, fontWeight: 700, color: "#ffffff", align: "left", letterSpacing: 3 },
      { type: "text",     x: 84,  y: 60,  w: 200, h: 16,  text: "TECHNOLOGY CO.", fontSize: 9,  fontWeight: 400, color: "#86efac", align: "left", letterSpacing: 2 },
      { type: "text",     x: 32,  y: 148, w: 326, h: 50,  text: "EMILY CARTER",   fontSize: 36, fontWeight: 800, color: "#ffffff", align: "left", letterSpacing: 1 },
      { type: "text",     x: 32,  y: 198, w: 326, h: 24,  text: "CEO MANAGER",    fontSize: 12, fontWeight: 500, color: "#86efac", align: "left", letterSpacing: 3 },
      { type: "divider",  x: 32,  y: 236, w: 80,  h: 2,   background: "rgba(255,255,255,0.2)", color: "transparent", radius: 2 },
      { type: "icon_row", x: 32,  y: 256, w: 326, h: 40,  text: "(555) 123-4567",          iconName: "Phone",  iconColor: "#86efac", background: "rgba(134,239,172,0.12)", color: "#d1fae5", radius: 8, fontSize: 13, fontWeight: 400 },
      { type: "icon_row", x: 32,  y: 302, w: 326, h: 40,  text: "hello@wardiere.com",      iconName: "Mail",   iconColor: "#86efac", background: "rgba(134,239,172,0.12)", color: "#d1fae5", radius: 8, fontSize: 13, fontWeight: 400 },
      { type: "icon_row", x: 32,  y: 348, w: 326, h: 40,  text: "www.wardieretechnology.com", iconName: "Globe",  iconColor: "#86efac", background: "rgba(134,239,172,0.12)", color: "#d1fae5", radius: 8, fontSize: 12, fontWeight: 400 },
      { type: "icon_row", x: 32,  y: 394, w: 326, h: 40,  text: "123 Anywhere St., Any City", iconName: "MapPin", iconColor: "#86efac", background: "rgba(134,239,172,0.12)", color: "#86efac", radius: 8, fontSize: 11, fontWeight: 400 },
      { type: "button",   x: 32,  y: 450, w: 326, h: 44,  text: "Save Contact",    background: "#86efac",                color: "#1a3a10", radius: 10, fontSize: 13, fontWeight: 700 },
      { type: "button",   x: 32,  y: 500, w: 326, h: 42,  text: "Share My Contact", background: "rgba(134,239,172,0.12)", color: "#86efac", radius: 10, fontSize: 12, fontWeight: 600 },
    ],
  },
  // ── Ivory ─────────────────────────────────────────────────────────────────
  {
    id: "ivory",
    name: "Ivory",
    category: "Light",
    accentColor: "#1a1a1a",
    thumb: "#ede8df",
    bg: { type: "solid", color: "#ede8df", gradient: "", imageUrl: "" },
    elements: [
      { type: "shape",    x: 0,   y: 0,   w: 390, h: 130, background: "#1a1a1a", radius: 0, color: "transparent" },
      { type: "text",     x: 32,  y: 32,  w: 120, h: 28,  text: "CODE", fontSize: 22, fontWeight: 900, color: "#ffffff", align: "left", letterSpacing: 2 },
      { type: "text",     x: 32,  y: 58,  w: 120, h: 28,  text: "PRO",  fontSize: 22, fontWeight: 900, color: "#c8b99a", align: "left", letterSpacing: 2 },
      { type: "text",     x: 32,  y: 90,  w: 200, h: 18,  text: "your tag slogan", fontSize: 10, fontWeight: 400, color: "#999999", align: "left", letterSpacing: 1 },
      { type: "divider",  x: 0,   y: 130, w: 390, h: 1,   background: "#c8b99a", color: "transparent" },
      { type: "text",     x: 32,  y: 156, w: 320, h: 50,  text: "JASON SMITH",  fontSize: 34, fontWeight: 800, color: "#1a1a1a", align: "left", letterSpacing: 1 },
      { type: "text",     x: 32,  y: 206, w: 320, h: 24,  text: "UX/UI DESIGNER", fontSize: 12, fontWeight: 500, color: "#888888", align: "left", letterSpacing: 3 },
      { type: "divider",  x: 32,  y: 242, w: 320, h: 1,   background: "#c8b99a", color: "transparent" },
      { type: "icon_row", x: 32,  y: 254, w: 326, h: 40,  text: "ur address goes here, Crossroad 123", iconName: "MapPin", iconColor: "#c8b99a", background: "rgba(200,185,154,0.15)", color: "#374151", radius: 8, fontSize: 11, fontWeight: 400 },
      { type: "icon_row", x: 32,  y: 300, w: 326, h: 40,  text: "+000 12345 6789",   iconName: "Phone",  iconColor: "#1a1a1a", background: "rgba(26,26,26,0.06)",    color: "#374151", radius: 8, fontSize: 12, fontWeight: 400 },
      { type: "icon_row", x: 32,  y: 346, w: 326, h: 40,  text: "urwebsitename.com", iconName: "Globe",  iconColor: "#1a1a1a", background: "rgba(26,26,26,0.06)",    color: "#374151", radius: 8, fontSize: 12, fontWeight: 400 },
      { type: "icon_row", x: 32,  y: 392, w: 326, h: 40,  text: "urname@email.com",  iconName: "Mail",   iconColor: "#1a1a1a", background: "rgba(26,26,26,0.06)",    color: "#374151", radius: 8, fontSize: 12, fontWeight: 400 },
      { type: "button",   x: 32,  y: 448, w: 326, h: 44,  text: "Save Contact",    background: "#1a1a1a",             color: "#ffffff", radius: 10, fontSize: 13, fontWeight: 700 },
      { type: "button",   x: 32,  y: 498, w: 326, h: 42,  text: "Share My Contact", background: "rgba(26,26,26,0.07)", color: "#444444", radius: 10, fontSize: 12, fontWeight: 600 },
    ],
  },
  // ── Executive ─────────────────────────────────────────────────────────────
  {
    id: "executive",
    name: "Executive",
    category: "Light",
    accentColor: "#1d4ed8",
    thumb: "#f8fafc",
    bg: { type: "solid", color: "#ffffff", gradient: "", imageUrl: "" },
    elements: [
      { type: "shape",    x: 0,   y: 0,   w: 390, h: 8,   background: "#2563eb", radius: 0, color: "transparent" },
      { type: "image",    x: 32,  y: 36,  w: 92,  h: 92,  radius: 46, src: "" },
      { type: "text",     x: 136, y: 46,  w: 222, h: 38,  text: "MARK SMITH",            fontSize: 34, fontWeight: 800, color: "#0f172a", align: "left", letterSpacing: 0.5 },
      { type: "text",     x: 136, y: 84,  w: 222, h: 20,  text: "Co-Founder",             fontSize: 12, fontWeight: 600, color: "#2563eb", align: "left", letterSpacing: 1.2 },
      { type: "text",     x: 136, y: 104, w: 222, h: 20,  text: "Brand Name",             fontSize: 12, fontWeight: 400, color: "#64748b", align: "left" },
      { type: "divider",  x: 32,  y: 146, w: 326, h: 1,   background: "rgba(15,23,42,0.10)", color: "transparent" },
      { type: "button",   x: 32,  y: 166, w: 156, h: 46,  text: "Call",                    background: "#2563eb", color: "#ffffff", radius: 12, fontSize: 14, fontWeight: 700 },
      { type: "button",   x: 202, y: 166, w: 156, h: 46,  text: "Email",                   background: "#e2e8f0", color: "#0f172a", radius: 12, fontSize: 14, fontWeight: 600 },
      { type: "text",     x: 32,  y: 230, w: 326, h: 16,  text: "CONTACT",                 fontSize: 10, fontWeight: 700, color: "#94a3b8", align: "left", letterSpacing: 2.4 },
      { type: "icon_row", x: 32,  y: 248, w: 326, h: 42,  text: "+00 1234 567 9012",       iconName: "Phone",  iconColor: "#2563eb", background: "#f1f5f9", color: "#334155", radius: 10, fontSize: 13, fontWeight: 500 },
      { type: "icon_row", x: 32,  y: 296, w: 326, h: 42,  text: "info@emailspace.com",     iconName: "Mail",   iconColor: "#2563eb", background: "#f1f5f9", color: "#334155", radius: 10, fontSize: 13, fontWeight: 500 },
      { type: "icon_row", x: 32,  y: 344, w: 326, h: 42,  text: "www.websiteaddress.com",  iconName: "Globe",  iconColor: "#2563eb", background: "#f1f5f9", color: "#334155", radius: 10, fontSize: 13, fontWeight: 500 },
      { type: "icon_row", x: 32,  y: 392, w: 326, h: 42,  text: "123 Dummy, Lorem Ipsum",  iconName: "MapPin", iconColor: "#2563eb", background: "#f1f5f9", color: "#334155", radius: 10, fontSize: 13, fontWeight: 500 },
      { type: "button",   x: 32,  y: 452, w: 326, h: 46,  text: "Save Contact",            background: "#0f172a", color: "#ffffff", radius: 12, fontSize: 13, fontWeight: 700 },
      { type: "button",   x: 32,  y: 504, w: 326, h: 42,  text: "Share My Contact",        background: "#e2e8f0", color: "#334155", radius: 12, fontSize: 12, fontWeight: 600 },
      { type: "shape",    x: 0,   y: 640, w: 390, h: 60,  background: "#f8fafc", radius: 0, color: "transparent" },
    ],
  },
  // ── Platinum ──────────────────────────────────────────────────────────────
  {
    id: "platinum",
    name: "Platinum",
    category: "Dark",
    accentColor: "#22c55e",
    thumb: "#0f172a",
    bg: { type: "solid", color: "#0f172a", gradient: "", imageUrl: "" },
    elements: [
      { type: "image",    x: 32,  y: 40,  w: 88,  h: 88,  radius: 44, src: "" },
      { type: "text",     x: 136, y: 54,  w: 220, h: 36,  text: "ALEX MORGAN",    fontSize: 24, fontWeight: 800, color: "#f1f5f9", align: "left", letterSpacing: 1 },
      { type: "text",     x: 136, y: 90,  w: 220, h: 20,  text: "SENIOR DESIGNER", fontSize: 10, fontWeight: 500, color: "#475569", align: "left", letterSpacing: 3 },
      { type: "text",     x: 136, y: 112, w: 220, h: 22,  text: "Nextap Studios",  fontSize: 13, fontWeight: 500, color: "#64748b", align: "left" },
      { type: "divider",  x: 32,  y: 150, w: 326, h: 1,   background: "rgba(148,163,184,0.1)", color: "transparent" },
      { type: "button",   x: 32,  y: 168, w: 152, h: 48,  text: "Call",    background: "#22c55e", color: "#fff", radius: 10, fontSize: 14, fontWeight: 600 },
      { type: "button",   x: 196, y: 168, w: 162, h: 48,  text: "Message", background: "rgba(255,255,255,0.06)", color: "#e2e8f0", radius: 10, fontSize: 13, fontWeight: 500 },
      { type: "text",     x: 32,  y: 244, w: 60,  h: 16,  text: "ABOUT", fontSize: 9, fontWeight: 600, color: "#334155", align: "left", letterSpacing: 3 },
      { type: "text",     x: 32,  y: 268, w: 326, h: 60,  text: "Building clean, modern NFC profile experiences for the next generation of networkers.", fontSize: 13, fontWeight: 400, color: "#64748b", align: "left" },
      { type: "divider",  x: 32,  y: 346, w: 326, h: 1,   background: "rgba(148,163,184,0.1)", color: "transparent" },
      { type: "icon_row", x: 32,  y: 356, w: 326, h: 40,  text: "+1 (555) 000-0000",  iconName: "Phone",  iconColor: "#22c55e", background: "rgba(34,197,94,0.08)",  color: "#94a3b8", radius: 8, fontSize: 13, fontWeight: 400 },
      { type: "icon_row", x: 32,  y: 402, w: 326, h: 40,  text: "alex@nextap.com",    iconName: "Mail",   iconColor: "#3b82f6", background: "rgba(59,130,246,0.08)",  color: "#94a3b8", radius: 8, fontSize: 13, fontWeight: 400 },
      { type: "icon_row", x: 32,  y: 448, w: 326, h: 40,  text: "nextap.com/alex",    iconName: "Globe",  iconColor: "#06b6d4", background: "rgba(6,182,212,0.08)",  color: "#94a3b8", radius: 8, fontSize: 13, fontWeight: 400 },
      { type: "button",   x: 32,  y: 506, w: 326, h: 44,  text: "Save Contact",    background: "rgba(34,197,94,0.15)",  color: "#86efac", radius: 10, fontSize: 13, fontWeight: 700 },
      { type: "button",   x: 32,  y: 556, w: 326, h: 42,  text: "Share My Contact", background: "rgba(255,255,255,0.05)", color: "#64748b", radius: 10, fontSize: 12, fontWeight: 600 },
    ],
  },
  // ── Rose Gold ─────────────────────────────────────────────────────────────
  {
    id: "rose",
    name: "Rose Gold",
    category: "Light",
    accentColor: "#be185d",
    thumb: "#fce7f3",
    bg: { type: "solid", color: "#fce7f3", gradient: "", imageUrl: "" },
    elements: [
      { type: "shape",    x: 0,   y: 0,   w: 390, h: 200, background: "#be185d", radius: 0,  color: "transparent" },
      { type: "image",    x: 145, y: 120, w: 100, h: 100, radius: 50, src: "" },
      { type: "text",     x: 32,  y: 242, w: 326, h: 42,  text: "SOPHIA LEE",      fontSize: 32, fontWeight: 800, color: "#1a1a1a", align: "center", letterSpacing: 2 },
      { type: "text",     x: 32,  y: 284, w: 326, h: 24,  text: "BRAND STRATEGIST", fontSize: 11, fontWeight: 600, color: "#be185d", align: "center", letterSpacing: 3 },
      { type: "divider",  x: 145, y: 320, w: 100, h: 2,   background: "#be185d", color: "transparent", radius: 2 },
      { type: "button",   x: 32,  y: 338, w: 152, h: 46,  text: "Call",  background: "#be185d", color: "#fff", radius: 10, fontSize: 14, fontWeight: 600 },
      { type: "button",   x: 202, y: 338, w: 156, h: 46,  text: "Email", background: "#1a1a1a", color: "#fff", radius: 10, fontSize: 14, fontWeight: 600 },
      { type: "icon_row", x: 32,  y: 400, w: 326, h: 40,  text: "+1 (555) 000-0000",  iconName: "Phone",  iconColor: "#be185d", background: "rgba(190,24,93,0.08)",  color: "#44403c", radius: 8, fontSize: 13, fontWeight: 400 },
      { type: "icon_row", x: 32,  y: 446, w: 326, h: 40,  text: "sophia@brand.com",   iconName: "Mail",   iconColor: "#be185d", background: "rgba(190,24,93,0.08)",  color: "#44403c", radius: 8, fontSize: 13, fontWeight: 400 },
      { type: "icon_row", x: 32,  y: 492, w: 326, h: 40,  text: "sophialee.co",        iconName: "Globe",  iconColor: "#be185d", background: "rgba(190,24,93,0.08)",  color: "#44403c", radius: 8, fontSize: 13, fontWeight: 400 },
      { type: "button",   x: 32,  y: 548, w: 326, h: 44,  text: "Save Contact",    background: "#be185d",                color: "#ffffff", radius: 10, fontSize: 13, fontWeight: 700 },
      { type: "button",   x: 32,  y: 598, w: 326, h: 40,  text: "Share My Contact", background: "rgba(190,24,93,0.10)",  color: "#be185d", radius: 10, fontSize: 12, fontWeight: 600 },
    ],
  },
  // ── Midnight Blue ─────────────────────────────────────────────────────────
  {
    id: "midnight_blue",
    name: "Midnight Blue",
    category: "Dark",
    accentColor: "#3b82f6",
    thumb: "#0a1628",
    bg: { type: "gradient", color: "#0a1628", gradient: "linear-gradient(160deg,#0a1628 0%,#0f2447 100%)", imageUrl: "" },
    elements: [
      { type: "shape",    x: 0,   y: 0,   w: 390, h: 4,   background: "#3b82f6", radius: 0,  color: "transparent" },
      { type: "image",    x: 32,  y: 40,  w: 110, h: 130, radius: 10, src: "" },
      { type: "text",     x: 160, y: 46,  w: 200, h: 42,  text: "RYAN COLE",     fontSize: 28, fontWeight: 800, color: "#e2e8f0", align: "left", letterSpacing: 1 },
      { type: "text",     x: 160, y: 88,  w: 200, h: 22,  text: "Product Designer", fontSize: 13, fontWeight: 400, color: "#3b82f6", align: "left" },
      { type: "text",     x: 160, y: 112, w: 200, h: 20,  text: "Nextap Creative", fontSize: 12, fontWeight: 400, color: "#64748b", align: "left" },
      { type: "divider",  x: 32,  y: 194, w: 326, h: 1,   background: "rgba(59,130,246,0.2)", color: "transparent" },
      { type: "icon_row", x: 32,  y: 206, w: 326, h: 42,  text: "+1 (555) 123-4567",  iconName: "Phone",  iconColor: "#3b82f6", background: "rgba(59,130,246,0.1)", color: "#94a3b8", radius: 10, fontSize: 13, fontWeight: 400 },
      { type: "icon_row", x: 32,  y: 254, w: 326, h: 42,  text: "ryan@nextap.com",    iconName: "Mail",   iconColor: "#3b82f6", background: "rgba(59,130,246,0.1)", color: "#94a3b8", radius: 10, fontSize: 13, fontWeight: 400 },
      { type: "icon_row", x: 32,  y: 302, w: 326, h: 42,  text: "nextap.com/ryan",    iconName: "Globe",  iconColor: "#3b82f6", background: "rgba(59,130,246,0.1)", color: "#94a3b8", radius: 10, fontSize: 13, fontWeight: 400 },
      { type: "icon_row", x: 32,  y: 350, w: 326, h: 42,  text: "San Francisco, CA",  iconName: "MapPin", iconColor: "#3b82f6", background: "rgba(59,130,246,0.1)", color: "#94a3b8", radius: 10, fontSize: 13, fontWeight: 400 },
      { type: "button",   x: 32,  y: 412, w: 326, h: 46,  text: "Save Contact",    background: "#3b82f6",                color: "#ffffff", radius: 12, fontSize: 14, fontWeight: 700 },
      { type: "button",   x: 32,  y: 464, w: 326, h: 42,  text: "Share My Contact", background: "rgba(59,130,246,0.10)",  color: "#93c5fd", radius: 12, fontSize: 13, fontWeight: 600 },
    ],
  },
  // ── Minimal Ink ───────────────────────────────────────────────────────────
  {
    id: "minimal_ink",
    name: "Minimal Ink",
    category: "Light",
    accentColor: "#000000",
    thumb: "#f5f5f0",
    bg: { type: "solid", color: "#f5f5f0", gradient: "", imageUrl: "" },
    elements: [
      { type: "shape",    x: 0,   y: 0,   w: 5,   h: 700, background: "#111111", radius: 0, color: "transparent" },
      { type: "text",     x: 40,  y: 60,  w: 310, h: 60,  text: "NOAH",   fontSize: 52, fontWeight: 900, color: "#111111", align: "left", letterSpacing: -1 },
      { type: "text",     x: 40,  y: 116, w: 310, h: 60,  text: "WILSON", fontSize: 52, fontWeight: 900, color: "#111111", align: "left", letterSpacing: -1 },
      { type: "text",     x: 40,  y: 178, w: 250, h: 24,  text: "Creative Director", fontSize: 15, fontWeight: 400, color: "#555555", align: "left" },
      { type: "divider",  x: 40,  y: 216, w: 60,  h: 3,   background: "#111111", color: "transparent", radius: 1 },
      { type: "icon_row", x: 40,  y: 232, w: 310, h: 40,  text: "+1 (555) 123 4567",     iconName: "Phone",  iconColor: "#111111", background: "rgba(17,17,17,0.06)", color: "#333333", radius: 8, fontSize: 13, fontWeight: 400 },
      { type: "icon_row", x: 40,  y: 278, w: 310, h: 40,  text: "noah@creative.studio",  iconName: "Mail",   iconColor: "#111111", background: "rgba(17,17,17,0.06)", color: "#333333", radius: 8, fontSize: 13, fontWeight: 400 },
      { type: "icon_row", x: 40,  y: 324, w: 310, h: 40,  text: "noah.studio",            iconName: "Globe",  iconColor: "#111111", background: "rgba(17,17,17,0.06)", color: "#333333", radius: 8, fontSize: 13, fontWeight: 400 },
      { type: "icon_row", x: 40,  y: 370, w: 310, h: 40,  text: "New York, NY 10001",     iconName: "MapPin", iconColor: "#111111", background: "rgba(17,17,17,0.06)", color: "#555555", radius: 8, fontSize: 13, fontWeight: 400 },
      { type: "button",   x: 40,  y: 428, w: 310, h: 44,  text: "Save Contact",    background: "#111111",             color: "#ffffff", radius: 10, fontSize: 13, fontWeight: 700 },
      { type: "button",   x: 40,  y: 478, w: 310, h: 42,  text: "Share My Contact", background: "rgba(17,17,17,0.07)", color: "#333333", radius: 10, fontSize: 12, fontWeight: 600 },
      { type: "image",    x: 240, y: 520, w: 130, h: 160, radius: 6,  src: "" },
    ],
  },
  // ── Solar ─────────────────────────────────────────────────────────────────
  {
    id: "solar",
    name: "Solar",
    category: "Dark",
    accentColor: "#fb923c",
    thumb: "#1c1008",
    bg: { type: "gradient", color: "#1c1008", gradient: "linear-gradient(145deg,#1c1008 0%,#2d1a06 100%)", imageUrl: "" },
    elements: [
      { type: "shape",    x: 0,   y: 620, w: 390, h: 80,  background: "#fb923c", radius: 0, color: "transparent" },
      { type: "shape",    x: 0,   y: 0,   w: 390, h: 6,   background: "#fb923c", radius: 0, color: "transparent" },
      { type: "image",    x: 130, y: 36,  w: 130, h: 130, radius: 65, src: "" },
      { type: "text",     x: 32,  y: 186, w: 326, h: 46,  text: "OMAR HASSAN",      fontSize: 32, fontWeight: 800, color: "#ffffff", align: "center", letterSpacing: 2 },
      { type: "text",     x: 32,  y: 232, w: 326, h: 24,  text: "SENIOR ARCHITECT",  fontSize: 12, fontWeight: 600, color: "#fb923c", align: "center", letterSpacing: 3 },
      { type: "divider",  x: 130, y: 268, w: 130, h: 2,   background: "rgba(251,146,60,0.4)", color: "transparent", radius: 1 },
      { type: "button",   x: 32,  y: 286, w: 152, h: 46,  text: "Call",  background: "#fb923c", color: "#111",   radius: 10, fontSize: 14, fontWeight: 700 },
      { type: "button",   x: 202, y: 286, w: 156, h: 46,  text: "Email", background: "rgba(255,255,255,0.07)", color: "#fff", radius: 10, fontSize: 14, fontWeight: 500 },
      { type: "icon_row", x: 32,  y: 350, w: 326, h: 42,  text: "+1 (555) 987 6543",   iconName: "Phone",  iconColor: "#fb923c", background: "rgba(251,146,60,0.1)",  color: "#a8a29e", radius: 10, fontSize: 13, fontWeight: 400 },
      { type: "icon_row", x: 32,  y: 398, w: 326, h: 42,  text: "omar@archstudio.com", iconName: "Mail",   iconColor: "#fb923c", background: "rgba(251,146,60,0.1)",  color: "#a8a29e", radius: 10, fontSize: 13, fontWeight: 400 },
      { type: "icon_row", x: 32,  y: 446, w: 326, h: 42,  text: "Dubai, UAE",           iconName: "MapPin", iconColor: "#fb923c", background: "rgba(251,146,60,0.1)",  color: "#78716c", radius: 10, fontSize: 13, fontWeight: 400 },
      { type: "button",   x: 32,  y: 508, w: 326, h: 46,  text: "Save Contact",    background: "#fb923c",               color: "#111111", radius: 12, fontSize: 14, fontWeight: 700 },
      { type: "button",   x: 32,  y: 560, w: 326, h: 42,  text: "Share My Contact", background: "rgba(251,146,60,0.12)", color: "#fb923c", radius: 12, fontSize: 13, fontWeight: 600 },
    ],
  },
];

// ─── Color swatches ───────────────────────────────────────────────────────────
const COLOR_SWATCHES = [
  "transparent",
  "#111111","#1a1a1a","#334155","#64748b",
  "#2d4a22","#3a5a2e","#065f46","#22c55e",
  "#0f172a","#1d4ed8","#0ea5e9","#3b82f6",
  "#581c87","#7c3aed","#be185d","#ec4899",
  "#f59e0b","#fb923c","#ef4444","#c8b99a",
  "#ffffff","#f5f5f0","#ede8df","#e2e8f0",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const createId = () => `el_${Math.random().toString(36).slice(2, 9)}`;

const BASE_ELEMENT: Omit<CanvasElement, "id" | "type" | "x" | "y" | "w" | "h"> = {
  fontSize: 14, color: "#0f172a", align: "left", fontWeight: 400,
  background: "transparent", radius: 0, padding: 0,
  opacity: 1, italic: false, locked: false, hidden: false,
  shadowColor: "rgba(0,0,0,0.1)", shadowBlur: 0, zIndex: 0, letterSpacing: 0,
};

const createElement = (type: ElementType, x = 60, y = 100): CanvasElement => {
  const id = createId();
  const zIndex = Date.now() % 10000;
  switch (type) {
    case "text":      return { ...BASE_ELEMENT, id, type, x, y, w: 280, h: 40, fontSize: 20, fontWeight: 700, color: "#0f172a", zIndex };
    case "button":    return { ...BASE_ELEMENT, id, type, x, y, w: 220, h: 48, fontSize: 14, fontWeight: 600, color: "#ffffff", background: "#111111", radius: 10, padding: 12, text: "Button", zIndex };
    case "link":      return { ...BASE_ELEMENT, id, type, x, y, w: 220, h: 36, fontSize: 13, fontWeight: 500, color: "#1d4ed8", text: "Visit link", href: "https://nextap.com", zIndex };
    case "image":     return { ...BASE_ELEMENT, id, type, x, y, w: 100, h: 100, radius: 50, src: "", zIndex };
    case "divider":   return { ...BASE_ELEMENT, id, type, x, y, w: 240, h: 2, background: "rgba(0,0,0,0.15)", zIndex };
    case "shape":     return { ...BASE_ELEMENT, id, type, x, y, w: 120, h: 120, background: "rgba(29,78,216,0.1)", radius: 12, zIndex };
    case "icon_row":  return { ...BASE_ELEMENT, id, type, x, y, w: 280, h: 44, fontSize: 13, fontWeight: 500, color: "#e2e8f0", background: "rgba(255,255,255,0.06)", radius: 10, text: "Add contact info", iconName: "Phone", iconColor: "#22c55e", zIndex };
  }
};

const applyTemplate = (tpl: typeof TEMPLATES[0]): CanvasElement[] =>
  tpl.elements.map((partial, i) => ({
    ...BASE_ELEMENT,
    ...createElement(partial.type ?? "text"),
    ...partial,
    id: createId(),
    zIndex: i,
    text: partial.text ?? (partial.type === "button" ? "Button" : partial.type === "link" ? "Link" : partial.type === "text" ? "Text" : ""),
  } as CanvasElement));

// ─── UI helpers ───────────────────────────────────────────────────────────────
const CategoryBadge = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${active ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}>
    {label}
  </button>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">{children}</p>
);

// ── Saved Design type ────────────────────────────────────────────────────────
type SavedDesign = {
  id: string;
  name: string;
  timestamp: number;
  elements: CanvasElement[];
  bg: CanvasBackground;
  templateId: string;
  isActive?: boolean;
};

// API shape returned by /api/designs
type ApiDesign = {
  id: string;
  name: string;
  elements: CanvasElement[];
  bg: CanvasBackground;
  template_id: string;
  is_active: boolean;
  created_at: string;
};

const apiDesignToSaved = (d: ApiDesign): SavedDesign => ({
  id: d.id,
  name: d.name,
  timestamp: d.created_at ? new Date(d.created_at).getTime() : Date.now(),
  elements: d.elements ?? [],
  bg: d.bg ?? { type: "solid", color: "#111111", gradient: "", imageUrl: "" },
  templateId: d.template_id ?? "",
  isActive: d.is_active,
});

// ── Share Contact Modal ───────────────────────────────────────────────────────
type ShareContactForm = { name: string; phone: string; email: string; company: string; note: string; };

const ShareContactModal = ({ onClose, cardOwnerName, profileSlug }: { onClose: () => void; cardOwnerName: string; profileSlug: string | null }) => {
  const [form, setForm] = useState<ShareContactForm>({ name: "", phone: "", email: "", company: "", note: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    if (!form.phone.trim() && !form.email.trim()) { toast.error("Phone or email is required."); return; }
    setLoading(true);
    try {
      if (profileSlug) {
        await apiRequest(`/api/profile/${profileSlug}/share-contact`, {
          method: "POST",
          body: JSON.stringify(form),
        });
      }
      toast.success(`Contact shared with ${cardOwnerName}!`);
      setSubmitted(true);
    } catch {
      toast.error("Failed to share contact. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-[#1a1c22] border border-white/10 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-white font-semibold text-lg">Contact Shared!</p>
            <p className="text-slate-400 text-sm">{cardOwnerName} will receive your contact details.</p>
            <button onClick={onClose} className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition-colors">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center"><UserPlus className="w-5 h-5 text-blue-400" /></div>
              <div>
                <p className="text-white font-semibold text-sm">Share Your Contact</p>
                <p className="text-slate-500 text-xs">with {cardOwnerName}</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { key: "name" as const,    placeholder: "Your full name *",  icon: "👤" },
                { key: "phone" as const,   placeholder: "Your phone *",      icon: "📞" },
                { key: "email" as const,   placeholder: "Your email",        icon: "✉️" },
                { key: "company" as const, placeholder: "Your company",      icon: "🏢" },
              ].map(({ key, placeholder, icon }) => (
                <div key={key} className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5">
                  <span className="text-base shrink-0">{icon}</span>
                  <input
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 outline-none"
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
              <textarea
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none resize-none"
                rows={2}
                placeholder="Short note (optional)"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
            <button onClick={handleSubmit} disabled={loading} className="mt-4 w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
              {loading ? "Sending…" : "Send My Contact"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ProfileStudioProfessional() {
  const [elements, setElementsRaw]      = useState<CanvasElement[]>(() => applyTemplate(TEMPLATES[0]));
  const [bg, setBg]                     = useState<CanvasBackground>(TEMPLATES[0].bg);
  const [activeTemplate, setActiveTemplate] = useState(TEMPLATES[0].id);

  // ── Undo / Redo history ──────────────────────────────────────────────────
  const historyRef    = useRef<CanvasElement[][]>([applyTemplate(TEMPLATES[0])]);
  const historyIdx    = useRef<number>(0);
  const skipHistory   = useRef(false); // set true during drag moves to avoid flooding

  const setElements = useCallback((value: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => {
    setElementsRaw((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      if (!skipHistory.current) {
        // Truncate forward history then push
        historyRef.current = historyRef.current.slice(0, historyIdx.current + 1);
        historyRef.current.push(next);
        historyIdx.current = historyRef.current.length - 1;
      }
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    if (historyIdx.current <= 0) return;
    historyIdx.current -= 1;
    skipHistory.current = true;
    setElementsRaw(historyRef.current[historyIdx.current]);
    skipHistory.current = false;
  }, []);

  const redo = useCallback(() => {
    if (historyIdx.current >= historyRef.current.length - 1) return;
    historyIdx.current += 1;
    skipHistory.current = true;
    setElementsRaw(historyRef.current[historyIdx.current]);
    skipHistory.current = false;
  }, []);

  const canUndo = historyIdx.current > 0;
  const canRedo = historyIdx.current < historyRef.current.length - 1;

  // Demo photos for fallback
  const DEMO_PHOTOS: { id: string; thumb: string; full: string; author: string }[] = [
    { id: "1", thumb: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&w=200", full: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&w=600", author: "Demo User" },
    { id: "2", thumb: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&w=200", full: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&w=600", author: "Demo User" },
    { id: "3", thumb: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&w=200", full: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&w=600", author: "Demo User" },
    { id: "4", thumb: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&w=200", full: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&w=600", author: "Demo User" },
  ];

  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [draggingId, setDraggingId]     = useState<string | null>(null);
  const [resizeId, setResizeId]         = useState<string | null>(null);
  const [dragOffset, setDragOffset]     = useState({ x: 0, y: 0 });
  const [previewMode, setPreviewMode]   = useState(false);
  const [leftTab, setLeftTab]           = useState<"templates" | "elements" | "saved" | "photos">("templates");
  const [photoQuery, setPhotoQuery]     = useState("");
  const [photoResults, setPhotoResults] = useState<{ id: string; thumb: string; full: string; author: string }[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [removingBg, setRemovingBg]     = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [activeDesignId, setActiveDesignId] = useState<string | null>(null);
  const [saveNameInput, setSaveNameInput] = useState("");
  const [designsLoading, setDesignsLoading] = useState(false);
  const [editingDesignId, setEditingDesignId] = useState<string | null>(null);
  const [profileSlug, setProfileSlug]   = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);
  const [stageScale, setStageScale] = useState(1);
  const stageHostRef = useRef<HTMLDivElement>(null);
  const canvasRef      = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const photosUploadRef = useRef<HTMLInputElement>(null);

  const selectedElement = useMemo(() => elements.find((el) => el.id === selectedId) ?? null, [elements, selectedId]);

  const updateElement = (id: string, patch: Partial<CanvasElement>) =>
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...patch } : el)));

  const addElement = (type: ElementType) => {
    const el = createElement(type, 60, 100 + (elements.length % 20) * 14);
    setElements((prev) => [...prev, el]);
    setSelectedId(el.id);
    setLeftTab("elements"); // fallback to a valid tab
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selectedElement) return;
    const dup = { ...selectedElement, id: createId(), x: selectedElement.x + 16, y: selectedElement.y + 16, zIndex: selectedElement.zIndex + 1 };
    setElements((prev) => [...prev, dup]);
    setSelectedId(dup.id);
  };

  const moveLayer = (id: string, dir: 1 | -1) => {
    setElements((prev) => {
      const idx = prev.findIndex((el) => el.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (previewMode) return;
    e.stopPropagation();
    const target = elements.find((el) => el.id === id);
    if (!target || target.locked) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDraggingId(id);
    setSelectedId(id);
    const localX = (e.clientX - rect.left) / stageScale;
    const localY = (e.clientY - rect.top) / stageScale;
    setDragOffset({ x: localX - target.x, y: localY - target.y });
  };

  const handleResizeDown = (e: React.PointerEvent, id: string) => {
    if (previewMode) return;
    e.stopPropagation();
    setResizeId(id);
    setSelectedId(id);
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const localX = (e.clientX - rect.left) / stageScale;
      const localY = (e.clientY - rect.top) / stageScale;
      if (draggingId) {
        skipHistory.current = true; // don't flood undo stack while dragging
        updateElement(draggingId, {
          x: Math.max(0, Math.min(CANVAS_W - 40, localX - dragOffset.x)),
          y: Math.max(0, Math.min(CANVAS_H - 40, localY - dragOffset.y)),
        });
      }
      if (resizeId) {
        skipHistory.current = true;
        const item = elements.find((el) => el.id === resizeId);
        if (!item) return;
        updateElement(resizeId, {
          w: Math.min(Math.max(40, localX - item.x), CANVAS_W - item.x),
          h: Math.min(Math.max(20, localY - item.y), CANVAS_H - item.y),
        });
      }
    };
    const onUp = () => {
      if (skipHistory.current && (draggingId || resizeId)) {
        // Commit final drag/resize position to history once
        skipHistory.current = false;
        setElementsRaw((prev) => {
          historyRef.current = historyRef.current.slice(0, historyIdx.current + 1);
          historyRef.current.push(prev);
          historyIdx.current = historyRef.current.length - 1;
          return prev;
        });
      }
      skipHistory.current = false;
      setDraggingId(null);
      setResizeId(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [draggingId, resizeId, dragOffset, elements, stageScale]);

  useEffect(() => {
    const host = stageHostRef.current;
    if (!host) return;
    const updateScale = () => {
      const hostRect = host.getBoundingClientRect();
      if (!hostRect.width || !hostRect.height) return;
      const padX = 24;
      const padY = 24;
      const scaleX = (hostRect.width - padX) / CANVAS_W;
      const scaleY = (hostRect.height - padY) / CANVAS_H;
      setStageScale(Math.max(0.6, Math.min(1, scaleX, scaleY)));
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  // Keyboard shortcuts: Ctrl+Z undo, Ctrl+Y / Ctrl+Shift+Z redo, Delete remove
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) removeSelected();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, selectedId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement || selectedElement.type !== "image") return;
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") updateElement(selectedElement.id, { src: reader.result }); };
    reader.readAsDataURL(file);
  };

  // Upload image from Photos tab — creates a new image element on the canvas
  const handlePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const el = createElement("image", 60, 60);
      el.src = reader.result;
      el.w = 180; el.h = 180; el.radius = 12;
      setElements((prev) => [...prev, el]);
      setSelectedId(el.id);
      toast.success("Image added to canvas!");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const searchPhotos = async () => {
    if (!photoQuery.trim()) return;
    setPhotoLoading(true);
    setPhotoResults([]);
    try {
      const PEXELS_KEY = "563492ad6f91700001000001ade4d3e8e99e436281e0c3b5b0e7f8c4";
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(photoQuery)}&per_page=20&orientation=portrait`,
        { headers: { Authorization: PEXELS_KEY } }
      );
      const data = await res.json();
      if (!data.photos || !data.photos.length) throw new Error("No results");
      setPhotoResults(
        (data.photos ?? []).map((p: { id: number; src: { medium: string; large: string }; photographer: string }) => ({
          id: String(p.id),
          thumb: p.src.medium,
          full: p.src.large,
          author: p.photographer,
        }))
      );
    } catch {
      toast.error("Photo search failed. Showing demo images.");
      setPhotoResults(DEMO_PHOTOS);
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleRemoveBg = async () => {
    if (!selectedElement || selectedElement.type !== "image" || !selectedElement.src) return;
    setRemovingBg(true);
    try {
      let blob: Blob;
      if (selectedElement.src.startsWith("data:")) {
        const res = await fetch(selectedElement.src);
        blob = await res.blob();
      } else {
        // For external URLs, fetch through a proxy to avoid CORS
        const res = await fetch(selectedElement.src);
        blob = await res.blob();
      }
      const resultBlob = await removeBackground(blob, {
        publicPath: `https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/dist/`,
        debug: false,
      });
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          updateElement(selectedElement.id, { src: reader.result });
          toast.success("Background removed!");
          setRemovingBg(false);
        }
      };
      reader.readAsDataURL(resultBlob);
    } catch (err) {
      console.error("Remove BG error:", err);
      setRemovingBg(false);
      toast.error("Background removal failed. Try uploading a local image first.");
    }
  };

  // Load profile slug + designs from backend on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    apiRequest<{ profile: { public_slug: string } }>("/api/profile/me", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setProfileSlug(res.profile.public_slug)).catch(() => {});

    setDesignsLoading(true);
    apiRequest<{ designs: ApiDesign[] }>("/api/designs", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      const saved = res.designs.map(apiDesignToSaved);
      setSavedDesigns(saved);
      const active = res.designs.find((d) => d.is_active);
      if (active) {
        setActiveDesignId(active.id);
        // Load the active design into the canvas
        const activeSaved = saved.find((d) => d.id === active.id);
        if (activeSaved) {
          setElements(activeSaved.elements);
          setBg(activeSaved.bg);
          setActiveTemplate(activeSaved.templateId);
        }
      }
    }).catch(() => {}).finally(() => setDesignsLoading(false));
  }, []);

  const saveCurrentDesign = async () => {
    const name = saveNameInput.trim() || `Design ${savedDesigns.length + 1}`;
    const token = localStorage.getItem("access_token");
    try {
      const res = await apiRequest<{ design: ApiDesign }>("/api/designs", {
        method: "POST",
        headers: { Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ name, elements, bg, template_id: activeTemplate }),
      });
      const saved = apiDesignToSaved(res.design);
      setSavedDesigns((prev) => [saved, ...prev]);
      setSaveNameInput("");
      toast.success(`"${name}" saved!`);
      setLeftTab("saved");
    } catch {
      toast.error("Failed to save design.");
    }
  };

  const loadDesign = (design: SavedDesign) => {
    setElements(design.elements);
    setBg(design.bg);
    setActiveTemplate(design.templateId);
    setSelectedId(null);
    setEditingDesignId(null);
    toast.success(`"${design.name}" loaded!`);
  };

  const deleteDesign = async (id: string) => {
    const token = localStorage.getItem("access_token");
    try {
      await apiRequest(`/api/designs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      setSavedDesigns((prev) => prev.filter((d) => d.id !== id));
      if (activeDesignId === id) setActiveDesignId(null);
    } catch {
      toast.error("Failed to delete design.");
    }
  };

  const markDesignActive = async (id: string) => {
    const token = localStorage.getItem("access_token");
    const isCurrentlyActive = id === activeDesignId;
    try {
      if (isCurrentlyActive) {
        await apiRequest(`/api/designs/${id}/deactivate`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token ?? ""}` },
        });
        setActiveDesignId(null);
        setSavedDesigns((prev) => prev.map((d) => ({ ...d, isActive: false })));
      } else {
        await apiRequest(`/api/designs/${id}/activate`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token ?? ""}` },
        });
        setActiveDesignId(id);
        setSavedDesigns((prev) => prev.map((d) => ({ ...d, isActive: d.id === id })));
        toast.success("Design marked as active card layout!");
      }
    } catch {
      toast.error("Failed to update active design.");
    }
  };

  const renameDesign = async (id: string, newName: string) => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await apiRequest<{ design: ApiDesign }>(`/api/designs/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ name: newName }),
      });
      setSavedDesigns((prev) => prev.map((d) => d.id === id ? { ...d, name: res.design.name } : d));
      setEditingDesignId(null);
    } catch {
      toast.error("Failed to rename design.");
    }
  };

  const filteredTemplates = TEMPLATES.filter((t) => categoryFilter === "All" || t.category === categoryFilter);
  const canvasBg = bg.type === "gradient" ? bg.gradient : bg.color;
  const cardOwnerName = elements.find((el) => el.type === "text" && el.fontSize >= 20)?.text?.slice(0, 30) ?? "Card Owner";

  const downloadVCard = () => {
    const texts     = elements.filter((e) => e.type === "text");
    const iconRows  = elements.filter((e) => e.type === "icon_row");

    // Best-guess name: largest bold text
    const name  = texts
      .filter((e) => (e.fontSize ?? 0) >= 20 && (e.fontWeight ?? 400) >= 600)
      .sort((a, b) => (b.fontSize ?? 0) - (a.fontSize ?? 0))[0]?.text ?? "";

    // Best-guess title: medium text near name
    const title = texts
      .filter((e) => (e.fontSize ?? 0) >= 9 && (e.fontSize ?? 0) < 20)
      .sort((a, b) => (b.fontWeight ?? 400) - (a.fontWeight ?? 400))[0]?.text ?? "";

    const phone   = iconRows.find((e) => e.iconName === "Phone")?.text ?? "";
    const wa      = iconRows.find((e) => e.iconName === "MessageCircle")?.text ?? "";
    const email   = iconRows.find((e) => e.iconName === "Mail")?.text ?? "";
    const website = iconRows.find((e) => e.iconName === "Globe")?.text ?? "";
    const address = iconRows.find((e) => e.iconName === "MapPin")?.text ?? "";
    const linkedin = iconRows.find((e) => e.iconName === "Linkedin")?.text ?? "";
    const twitter  = iconRows.find((e) => e.iconName === "Twitter")?.text ?? "";

    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${name}`,
      `TITLE:${title}`,
      phone   ? `TEL;TYPE=CELL:${phone}` : "",
      wa      ? `TEL;TYPE=WORK:${wa}`    : "",
      email   ? `EMAIL:${email}`         : "",
      website ? `URL:${website.startsWith("http") ? website : "https://" + website}` : "",
      linkedin ? `X-SOCIALPROFILE;type=linkedin:${linkedin}` : "",
      twitter  ? `X-SOCIALPROFILE;type=twitter:${twitter}`   : "",
      address  ? `ADR;TYPE=WORK:;;${address};;;;`             : "",
      "END:VCARD",
    ].filter(Boolean).join("\r\n");

    const blob = new Blob([lines], { type: "text/vcard;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${name.replace(/\s+/g, "_") || "contact"}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("vCard downloaded!");
  };

  // Quick-add icon row presets
  const ICON_PRESETS: { label: string; Icon: React.ElementType; color: string; text: string; iconName: string }[] = [
    { label: "Phone",     Icon: Phone,         color: "#22c55e", text: "+1 (555) 000-0000",       iconName: "Phone" },
    { label: "Email",     Icon: Mail,           color: "#3b82f6", text: "name@email.com",           iconName: "Mail" },
    { label: "Website",   Icon: Globe,          color: "#06b6d4", text: "www.website.com",          iconName: "Globe" },
    { label: "Location",  Icon: MapPin,         color: "#f59e0b", text: "City, Country",            iconName: "MapPin" },
    { label: "WhatsApp",  Icon: MessageCircle,  color: "#25d366", text: "+1 (555) 000-0000",       iconName: "MessageCircle" },
    { label: "LinkedIn",  Icon: Linkedin,       color: "#0a66c2", text: "linkedin.com/in/name",    iconName: "Linkedin" },
    { label: "Twitter",   Icon: Twitter,        color: "#1da1f2", text: "@username",               iconName: "Twitter" },
    { label: "Instagram", Icon: Instagram,      color: "#e1306c", text: "@username",               iconName: "Instagram" },
    { label: "YouTube",   Icon: Youtube,        color: "#ff0000", text: "youtube.com/c/name",      iconName: "Youtube" },
    { label: "Calendar",  Icon: Clock,          color: "#8b5cf6", text: "Book a meeting",          iconName: "Clock" },
    { label: "Telegram",  Icon: Send,           color: "#2ca5e0", text: "@username",               iconName: "Send" },
    { label: "Portfolio", Icon: Star,           color: "#fb923c", text: "portfolio.com",           iconName: "Star" },
  ];

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-[#0e0e10] text-white" style={{ userSelect: "none" }}>

      {/* ── Left Panel — desktop sidebar + mobile drawer ───────── */}
      {/* Desktop */}
      <aside className="hidden md:flex h-full min-h-0 flex-col w-[220px] shrink-0 border-r border-white/[0.06] bg-[#141416] overflow-hidden">
        <div className="flex border-b border-white/[0.06]">
          {["templates", "elements", "photos", "saved"].map((tab) => (
            <button key={tab} onClick={() => setLeftTab(tab as "templates" | "elements" | "photos" | "saved")}
              className={`flex-1 py-2.5 transition-colors relative ${leftTab === tab ? "text-white border-b-2 border-white bg-white/[0.03]" : "text-slate-500 hover:text-slate-300"}`}>
              {tab === "templates" ? <LayoutTemplate className="w-5 h-5 mx-auto" />
                : tab === "elements" ? <Plus className="w-5 h-5 mx-auto" />
                : tab === "photos" ? <ImageIcon className="w-5 h-5 mx-auto" />
                : <Bookmark className="w-5 h-5 mx-auto" />}
              {tab === "saved" && savedDesigns.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-[7px] font-bold text-white flex items-center justify-center">
                  {savedDesigns.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">

          {/* TEMPLATES */}
          {leftTab === "templates" && (
            <>
              <div className="flex gap-1 p-1 bg-white/[0.04] rounded-lg mb-2">
                {["All", "Dark", "Light"].map((cat) => (
                  <CategoryBadge key={cat} label={cat} active={categoryFilter === cat} onClick={() => setCategoryFilter(cat)} />
                ))}
              </div>
              <div className="space-y-1.5 pr-1">
                {filteredTemplates.map((tpl) => (
                  <button key={tpl.id}
                    onClick={() => { setElements(applyTemplate(tpl)); setBg(tpl.bg); setActiveTemplate(tpl.id); setSelectedId(null); }}
                    className={`w-full rounded-lg overflow-hidden border transition-all flex items-center px-2 py-2 gap-2 ${activeTemplate === tpl.id ? "border-white/60 bg-white/[0.06]" : "border-white/[0.08] hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.04]"}`}>
                    <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-xs font-bold text-white/80 uppercase">
                      {tpl.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-white/90 truncate">{tpl.name}</div>
                      <div className="text-[8px] text-white/40 truncate">{tpl.category}</div>
                    </div>
                    {activeTemplate === tpl.id && (
                      <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-slate-900" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ELEMENTS */}
          {leftTab === "elements" && (
            <div className="space-y-4">
              <div>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-2">Blocks</p>
                <div className="grid grid-cols-3 gap-1">
                  {([
                    { type: "text" as ElementType,    icon: <Type className="w-4 h-4" />,     label: "Text" },
                    { type: "button" as ElementType,  icon: <CreditCard className="w-4 h-4" />, label: "Button" },
                    { type: "link" as ElementType,    icon: <LinkIcon className="w-4 h-4" />,  label: "Link" },
                    { type: "image" as ElementType,   icon: <Camera className="w-4 h-4" />,    label: "Image" },
                    { type: "divider" as ElementType, icon: <Minus className="w-4 h-4" />,     label: "Divider" },
                    { type: "shape" as ElementType,   icon: <Maximize2 className="w-4 h-4" />, label: "Shape" },
                  ]).map(({ type, icon, label }) => (
                    <button key={type} onClick={() => addElement(type)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors">
                      <span className="text-slate-400">{icon}</span>
                      <span className="text-[9px] text-slate-500">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Shape Presets */}
              <div>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-2">Shape Presets</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "Circle",    w: 100, h: 100, radius: 999, bg: "rgba(99,102,241,0.18)" },
                    { label: "Pill",      w: 180, h: 44,  radius: 999, bg: "rgba(34,197,94,0.15)"  },
                    { label: "Card",      w: 280, h: 70,  radius: 16,  bg: "rgba(255,255,255,0.06)" },
                    { label: "Accent Bar",w: 240, h: 4,   radius: 2,   bg: "rgba(59,130,246,0.6)"  },
                    { label: "Blob",      w: 200, h: 200, radius: 60,  bg: "rgba(168,85,247,0.12)" },
                    { label: "Square",    w: 80,  h: 80,  radius: 8,   bg: "rgba(245,158,11,0.15)" },
                  ].map(({ label, w, h, radius, bg: shapeBg }) => (
                    <button key={label}
                      onClick={() => {
                        const el = createElement("shape", 60 + Math.random() * 80, 80 + Math.random() * 100);
                        el.w = w; el.h = h; el.radius = radius; el.background = shapeBg;
                        setElements((prev) => [...prev, el]);
                        setSelectedId(el.id);
                      }}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors">
                      <div className="w-8 h-5 flex items-center justify-center">
                        <div style={{ width: Math.min(28, w / 6), height: Math.min(20, h / 6), borderRadius: Math.min(radius, 8), background: shapeBg.replace(/[\d.]+\)$/, "0.8)") }} />
                      </div>
                      <span className="text-[9px] font-medium text-slate-400">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-2">Quick Contact Icons</p>
                <div className="grid grid-cols-3 gap-1">
                  {ICON_PRESETS.map(({ Icon, color, text, iconName }) => (
                    <button key={iconName}
                      onClick={() => {
                        const el = createElement("icon_row", 55, 100 + (elements.length % 12) * 52);
                        el.text = text;
                        el.iconName = iconName;
                        el.iconColor = color;
                        el.w = 280; el.h = 44;
                        el.background = color + "18";
                        el.radius = 10;
                        el.fontSize = 13;
                        el.fontWeight = 500;
                        el.color = "#e2e8f0";
                        setElements((prev) => [...prev, el]);
                        setSelectedId(el.id);
                      }}
                      className="flex items-center justify-center p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.04] transition-colors">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + "22" }}>
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PHOTOS */}
          {leftTab === "photos" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <button onClick={() => photosUploadRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] text-slate-300 text-xs font-medium transition-colors">
                  <Upload className="w-3.5 h-3.5" /> Upload Image
                </button>
                <input ref={photosUploadRef} type="file" accept="image/*" className="hidden" onChange={handlePhotosUpload} />
              </div>
              <div className="flex gap-1.5">
                <input value={photoQuery} onChange={(e) => setPhotoQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchPhotos()}
                  placeholder="Search photos…"
                  className="flex-1 h-8 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-white placeholder:text-slate-600 outline-none focus:border-white/20" />
                <button onClick={searchPhotos} disabled={photoLoading}
                  className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-40">
                  {photoLoading ? <div className="w-3 h-3 border-2 border-slate-500 border-t-slate-200 rounded-full animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                </button>
              </div>
              {(photoResults.length > 0 ? photoResults : DEMO_PHOTOS).map((p) => (
                <div key={p.id} className="relative group rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => {
                    const el = createElement("image", 60, 60);
                    el.src = p.full; el.w = 180; el.h = 220; el.radius = 10;
                    setElements((prev) => [...prev, el]);
                    setSelectedId(el.id);
                    toast.success("Photo added!");
                  }}>
                  <img src={p.thumb} alt={p.author} className="w-full h-24 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-[8px] text-slate-600 px-1 py-0.5 truncate">{p.author}</p>
                </div>
              ))}
            </div>
          )}

          {/* SAVED DESIGNS */}
          {leftTab === "saved" && (
            <div className="space-y-3">
              {/* Save current design */}
              <div className="space-y-2">
                <p className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold">Save Current Design</p>
                <input
                  value={saveNameInput}
                  onChange={(e) => setSaveNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveCurrentDesign()}
                  placeholder={`Design ${savedDesigns.length + 1}`}
                  className="w-full h-8 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-white placeholder:text-slate-600 outline-none focus:border-white/20"
                />
                <button
                  onClick={saveCurrentDesign}
                  className="w-full py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5" /> Save to Cloud
                </button>
              </div>

              {designsLoading ? (
                <div className="text-center py-8 text-slate-600 space-y-2">
                  <div className="w-5 h-5 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin mx-auto" />
                  <p className="text-[10px]">Loading designs…</p>
                </div>
              ) : savedDesigns.length === 0 ? (
                <div className="text-center py-8 text-slate-600 space-y-1">
                  <Bookmark className="w-6 h-6 mx-auto opacity-40" />
                  <p className="text-[10px]">No saved designs yet</p>
                  <p className="text-[9px] opacity-60">Designs are saved to your account</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold">{savedDesigns.length} Cloud Designs</p>
                  {savedDesigns.map((design) => {
                    const isActive = design.id === activeDesignId;
                    const isEditing = editingDesignId === design.id;
                    return (
                      <div key={design.id} className={`rounded-xl border p-3 space-y-2.5 ${isActive ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/[0.06] bg-white/[0.03]"}`}>
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0 flex-1">
                            {isEditing ? (
                              <input
                                autoFocus
                                defaultValue={design.name}
                                className="w-full h-6 text-xs bg-white/[0.08] border border-white/20 rounded px-2 text-white outline-none"
                                onBlur={(e) => { if (e.target.value.trim()) renameDesign(design.id, e.target.value.trim()); else setEditingDesignId(null); }}
                                onKeyDown={(e) => { if (e.key === "Enter" && e.currentTarget.value.trim()) renameDesign(design.id, e.currentTarget.value.trim()); if (e.key === "Escape") setEditingDesignId(null); }}
                              />
                            ) : (
                              <p className="text-xs font-semibold text-white truncate cursor-pointer hover:text-slate-200" onClick={() => setEditingDesignId(design.id)} title="Click to rename">{design.name}</p>
                            )}
                            <p className="text-[9px] text-slate-600 mt-0.5">{new Date(design.timestamp).toLocaleDateString()}</p>
                          </div>
                          {isActive && (
                            <span className="shrink-0 flex items-center gap-0.5 text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                              <BookmarkCheck className="w-2.5 h-2.5" /> Active
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => loadDesign(design)}
                            className="flex-1 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-[10px] font-medium text-slate-300 hover:text-white transition-colors">
                            Load
                          </button>
                          <button onClick={() => markDesignActive(design.id)}
                            title={isActive ? "Unmark as active" : "Set as active card layout"}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.06] hover:bg-white/10 text-slate-500 hover:text-white"}`}>
                            <BookmarkCheck className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteDesign(design.id)}
                            className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ── Canvas Area ──────────────────────────────────────── */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Header — horizontally scrollable on mobile */}
        <header className="flex items-center border-b border-white/[0.06] bg-[#141416] shrink-0 min-h-[48px] overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 px-4 py-2.5 min-w-max w-full">
            {/* Brand */}
            <span className="text-sm font-bold text-white whitespace-nowrap mr-1">Profile Studio</span>
            <span className="text-white/20 text-base">/</span>
            <span className="text-sm text-slate-400 whitespace-nowrap">NFC Card</span>

            {/* Spacer */}
            <div className="flex-1 min-w-4" />

            {/* Undo / Redo */}
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0">
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0">
              <Redo2 className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-white/10 mx-1 shrink-0" />

            {/* Preview */}
            <button
              onClick={() => setPreviewMode((p) => !p)}
              className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium transition-colors shrink-0 ${previewMode ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.06]"}`}>
              <Eye className="w-3.5 h-3.5" />
              {previewMode ? "Editing" : "Preview"}
            </button>

            {/* Save */}
            <button
              onClick={() => { setLeftTab("saved"); saveCurrentDesign(); }}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 transition-colors shrink-0">
              <Bookmark className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </header>

        {/* Stage */}
        <div ref={stageHostRef} className="flex-1 min-h-0 overflow-hidden flex items-center justify-center py-2 px-4"
          style={{ backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)", backgroundSize: "24px 24px", backgroundColor: "#f1f5f9" }}>
          <div className="relative shrink-0"
            style={{ width: CANVAS_W * stageScale, height: CANVAS_H * stageScale }}>
          <div className="relative shrink-0"
            style={{ width: CANVAS_W, height: CANVAS_H, background: canvasBg, boxShadow: "0 50px 130px rgba(0,0,0,0.85), 0 20px 40px rgba(0,0,0,0.5)", transform: `scale(${stageScale})`, transformOrigin: "top left" }}
            ref={canvasRef}
            onPointerDown={(e) => { if (e.target === e.currentTarget && !previewMode) setSelectedId(null); }}>
              {elements.filter(el => !el.hidden).map((el) => {
                const isSelected = el.id === selectedId && !previewMode;
                const isInteractive = previewMode && (el.type === "button" || el.type === "icon_row" || el.type === "link");

                const handlePreviewClick = () => {
                  if (!previewMode) return;
                  if (el.type === "button") {
                    const t = (el.text ?? "").toLowerCase();
                    if (t.includes("save contact") || t.includes("download")) {
                      downloadVCard();
                    } else if (t.includes("share") || t.includes("my contact")) {
                      setShareModalOpen(true);
                    } else if (t === "call" || t.includes("phone")) {
                      const phone = elements.find((e2) => e2.type === "icon_row" && e2.iconName === "Phone")?.text;
                      if (phone) window.open(`tel:${phone}`);
                    } else if (t === "email" || t === "mail") {
                      const email = elements.find((e2) => e2.type === "icon_row" && e2.iconName === "Mail")?.text;
                      if (email) window.open(`mailto:${email}`);
                    } else if (t === "message" || t.includes("whatsapp")) {
                      const wa = elements.find((e2) => e2.type === "icon_row" && e2.iconName === "MessageCircle")?.text;
                      if (wa) window.open(`https://wa.me/${wa.replace(/\D/g, "")}`);
                    }
                  } else if (el.type === "icon_row") {
                    const text = el.text ?? "";
                    const name = el.iconName ?? "";
                    if (name === "Phone") window.open(`tel:${text}`);
                    else if (name === "Mail") window.open(`mailto:${text}`);
                    else if (name === "Globe") window.open(text.startsWith("http") ? text : `https://${text}`);
                    else if (name === "MessageCircle") window.open(`https://wa.me/${text.replace(/\D/g, "")}`);
                    else if (name === "Linkedin") window.open(text.startsWith("http") ? text : `https://linkedin.com/in/${text}`);
                    else if (name === "Twitter") window.open(`https://twitter.com/${text.replace("@", "")}`);
                    else if (name === "Instagram") window.open(`https://instagram.com/${text.replace("@", "")}`);
                    else if (name === "Send") window.open(`https://t.me/${text.replace("@", "")}`);
                  } else if (el.type === "link" && el.href) {
                    window.open(el.href);
                  }
                };

                return (
                  <div key={el.id}
                    className={`absolute ${!previewMode ? "cursor-move" : isInteractive ? "cursor-pointer" : "cursor-default"}`}
                    style={{
                      left: el.x, top: el.y, width: el.w, height: el.h,
                      padding: el.padding || undefined,
                      borderRadius: el.radius || undefined,
                      background: el.background !== "transparent" ? el.background : undefined,
                      textAlign: el.align, color: el.color, fontSize: el.fontSize, fontWeight: el.fontWeight,
                      letterSpacing: el.letterSpacing ? el.letterSpacing : undefined,
                      fontStyle: el.italic ? "italic" : undefined,
                      opacity: el.opacity, zIndex: el.zIndex,
                      direction: "ltr", unicodeBidi: "embed",
                      outline: isSelected ? "2px solid rgba(255,255,255,0.7)" : "none",
                      outlineOffset: isSelected ? 2 : undefined,
                      display: el.type === "icon_row" ? "flex" : undefined,
                      alignItems: el.type === "icon_row" ? "stretch" : undefined,
                      transition: isInteractive ? "opacity 0.15s" : undefined,
                    }}
                    onPointerDown={(e) => handlePointerDown(e, el.id)}
                    onClick={handlePreviewClick}>
                    {el.type === "image" ? (
                      <img src={el.src} alt="" className="w-full h-full object-cover" style={{ borderRadius: el.radius }} draggable={false} />
                    ) : el.type === "shape" || el.type === "divider" ? null
                    : el.type === "icon_row" ? (() => {
                      const IconComp = el.iconName ? ICON_MAP[el.iconName] : null;
                      const iconCol = el.iconColor ?? "#64748b";
                      return (
                        <div className="flex items-center gap-2.5 px-3 w-full h-full" style={{ pointerEvents: "none" }}>
                          <div className="shrink-0 flex items-center justify-center rounded-lg"
                            style={{ width: 30, height: 30, background: iconCol + "22" }}>
                            {IconComp && <IconComp style={{ width: 15, height: 15, color: iconCol }} />}
                          </div>
                          <div
                        contentEditable={!previewMode}
                            suppressContentEditableWarning
                            dir="ltr"
                            className="outline-none flex-1 truncate"
                            style={{ fontSize: el.fontSize, color: el.color, fontWeight: el.fontWeight, lineHeight: 1.3, pointerEvents: previewMode ? "none" : "auto", direction: "ltr", unicodeBidi: "embed" }}
                            onBlur={(e) => updateElement(el.id, { text: e.currentTarget.textContent ?? "" })}>
                            {el.text}
                          </div>
                        </div>
                      );
                    })()
                    : (
                      <div contentEditable={!previewMode} suppressContentEditableWarning dir="ltr"
                        className="w-full h-full outline-none" style={{ lineHeight: 1.25, direction: "ltr", unicodeBidi: "embed" }}
                        onBlur={(e) => updateElement(el.id, { text: e.currentTarget.textContent ?? "" })}>
                        {el.text}
                      </div>
                    )}
                    {isSelected && (
                      <>
                        <button type="button"
                          className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center z-50 shadow-lg"
                          onPointerDown={(e) => { e.stopPropagation(); removeSelected(); }}>
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border-2 border-slate-900 rounded-sm cursor-se-resize z-50"
                          onPointerDown={(e) => handleResizeDown(e, el.id)} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile bottom toolbar */}
        <div className="md:hidden shrink-0 flex items-center gap-1 px-3 py-2 bg-[#141416] border-t border-white/[0.06]">
          <button onClick={() => { setMobileLeftOpen(true); setMobileRightOpen(false); }}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
            <LayoutTemplate className="w-4 h-4 text-slate-400" />
            <span className="text-[9px] text-slate-500">Design</span>
          </button>
          <button onClick={() => { setMobileLeftOpen(true); setLeftTab("elements"); setMobileRightOpen(false); }}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
            <Plus className="w-4 h-4 text-slate-400" />
            <span className="text-[9px] text-slate-500">Add</span>
          </button>
          <button onClick={() => { setMobileRightOpen(true); setMobileLeftOpen(false); }}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-colors ${selectedElement ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/[0.04]"}`}>
            <Pencil className={`w-4 h-4 ${selectedElement ? "text-emerald-400" : "text-slate-500"}`} />
            <span className={`text-[9px] ${selectedElement ? "text-emerald-400" : "text-slate-500"}`}>Edit</span>
          </button>
          <button onClick={() => setPreviewMode((p) => !p)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-colors ${previewMode ? "bg-white/10" : "bg-white/[0.04] hover:bg-white/[0.08]"}`}>
            <Eye className="w-4 h-4 text-slate-400" />
            <span className="text-[9px] text-slate-500">{previewMode ? "Edit" : "View"}</span>
          </button>
          <button onClick={() => { saveCurrentDesign(); setMobileLeftOpen(true); setLeftTab("saved"); setMobileRightOpen(false); }}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 transition-colors">
            <Save className="w-4 h-4 text-white" />
            <span className="text-[9px] text-white">Saved</span>
          </button>
        </div>
      </main>

      {/* ── Right Inspector — desktop only ──────────────────────── */}
      <aside className="hidden md:flex h-full min-h-0 w-[264px] shrink-0 border-l border-white/[0.06] bg-[#141416] flex-col overflow-hidden">
        <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white">Inspector</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{selectedElement ? `${selectedElement.type}` : "Select element"}</p>
          </div>
          {selectedElement && (
            <button onClick={duplicateSelected} title="Duplicate" className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {selectedElement ? (
            <>
              {/* Geometry */}
              <section>
                <Label>Geometry</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["x","y","w","h"] as const).map((key) => (
                    <div key={key}>
                      <p className="text-[9px] text-slate-600 uppercase mb-1">{key}</p>
                      <Input type="number" value={selectedElement[key]}
                        onChange={(e) => updateElement(selectedElement.id, { [key]: Number(e.target.value) })}
                        className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Typography */}
              {!["shape","divider","image"].includes(selectedElement.type) && (
                <section>
                  <Label>Typography</Label>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 w-12 shrink-0">Size</span>
                      <div className="flex items-center gap-1 flex-1">
                        <button className="w-6 h-6 rounded bg-white/[0.06] hover:bg-white/10 flex items-center justify-center"
                          onClick={() => updateElement(selectedElement.id, { fontSize: Math.max(8, selectedElement.fontSize - 1) })}><Minus className="w-3 h-3" /></button>
                        <span className="text-xs text-white text-center flex-1">{selectedElement.fontSize}px</span>
                        <button className="w-6 h-6 rounded bg-white/[0.06] hover:bg-white/10 flex items-center justify-center"
                          onClick={() => updateElement(selectedElement.id, { fontSize: selectedElement.fontSize + 1 })}><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 w-12 shrink-0">Weight</span>
                      <select value={selectedElement.fontWeight} onChange={(e) => updateElement(selectedElement.id, { fontWeight: Number(e.target.value) as any })}
                        className="flex-1 h-7 text-xs rounded bg-white/[0.06] border border-white/[0.08] text-white px-2">
                        {[400,500,600,700,800,900].map((w) => <option key={w} value={w} className="bg-[#1a1a1e]">{w}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 w-12 shrink-0">Spacing</span>
                      <input type="range" min={0} max={12} step={0.5} value={selectedElement.letterSpacing}
                        onChange={(e) => updateElement(selectedElement.id, { letterSpacing: Number(e.target.value) })} className="flex-1 accent-white" />
                      <span className="text-[9px] text-slate-500 w-4">{selectedElement.letterSpacing}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 w-12 shrink-0">Align</span>
                      <div className="flex gap-1">
                        {(["left","center","right"] as const).map((a) => {
                          const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
                          return (
                            <button key={a} onClick={() => updateElement(selectedElement.id, { align: a })}
                              className={`w-7 h-7 rounded flex items-center justify-center ${selectedElement.align === a ? "bg-white text-slate-900" : "bg-white/[0.06] text-slate-400 hover:bg-white/10"}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 w-12 shrink-0">Italic</span>
                      <button onClick={() => updateElement(selectedElement.id, { italic: !selectedElement.italic })}
                        className={`w-7 h-7 rounded flex items-center justify-center ${selectedElement.italic ? "bg-white text-slate-900" : "bg-white/[0.06] text-slate-400"}`}>
                        <ItalicIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Color */}
              <section>
                <Label>Color</Label>
                <div className="space-y-2.5">
                  {!["image","divider","shape"].includes(selectedElement.type) && (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 w-10 shrink-0">Text</span>
                      <input type="color" value={selectedElement.color} onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent shrink-0" />
                      <span className="text-[10px] text-slate-500 font-mono">{selectedElement.color}</span>
                    </div>
                  )}
                  {["button","shape","divider","icon_row"].includes(selectedElement.type) && (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 w-10 shrink-0">Fill</span>
                      <input type="color" value={selectedElement.background === "transparent" ? "#000000" : selectedElement.background} onChange={(e) => updateElement(selectedElement.id, { background: e.target.value })} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent shrink-0" />
                      <span className="text-[10px] text-slate-500 font-mono truncate">{selectedElement.background}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_SWATCHES.map((c) => (
                      <button key={c} title={c}
                        onClick={() => {
                          if (["button","shape","divider","icon_row"].includes(selectedElement.type)) updateElement(selectedElement.id, { background: c });
                          else updateElement(selectedElement.id, { color: c });
                        }}
                        className="w-5 h-5 rounded-full border border-white/10 hover:scale-110 transition-transform shrink-0"
                            style={c === "transparent" ? {
                          background: "conic-gradient(#aaa 90deg, white 90deg 180deg, #aaa 180deg 270deg, white 270deg)",
                          backgroundSize: "8px 8px",
                          outline: (selectedElement.color === c || selectedElement.background === c) ? "2px solid rgba(255,255,255,0.7)" : "none",
                          outlineOffset: 2,
                        } : {
                          background: c,
                          outline: (selectedElement.color === c || selectedElement.background === c) ? "2px solid rgba(255,255,255,0.7)" : "none",
                          outlineOffset: 2,
                        }} />
                    ))}
                  </div>
                </div>
              </section>

              {/* Appearance */}
              <section>
                <Label>Appearance</Label>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 w-12 shrink-0">Radius</span>
                    <input type="range" min={0} max={60} step={1} value={selectedElement.radius}
                      onChange={(e) => updateElement(selectedElement.id, { radius: Number(e.target.value) })} className="flex-1 accent-white" />
                    <span className="text-[9px] text-slate-500 w-5">{selectedElement.radius}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 w-12 shrink-0">Opacity</span>
                    <input type="range" min={0} max={1} step={0.01} value={selectedElement.opacity}
                      onChange={(e) => updateElement(selectedElement.id, { opacity: Number(e.target.value) })} className="flex-1 accent-white" />
                    <span className="text-[9px] text-slate-500 w-7">{Math.round(selectedElement.opacity * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 w-12 shrink-0">Lock</span>
                    <button onClick={() => updateElement(selectedElement.id, { locked: !selectedElement.locked })}
                      className={`px-3 h-7 rounded text-[10px] font-medium transition-colors ${selectedElement.locked ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" : "bg-white/[0.06] text-slate-400"}`}>
                      {selectedElement.locked ? "🔒 Locked" : "Unlock"}
                    </button>
                  </div>
                </div>
              </section>

              {/* Image upload */}
              {selectedElement.type === "image" && (
                <section>
                  <Label>Image</Label>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full text-xs border-white/10 text-slate-300 hover:bg-white/10 bg-transparent"
                      onClick={() => uploadInputRef.current?.click()}>
                      <ImagePlus className="w-3.5 h-3.5 mr-1.5" /> Upload Photo
                    </Button>
                    <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <Input value={selectedElement.src ?? ""} onChange={(e) => updateElement(selectedElement.id, { src: e.target.value })}
                      className="text-xs bg-white/[0.04] border-white/[0.08] text-slate-300" placeholder="Paste image URL" />
                    {selectedElement.src && (
                      <Button variant="outline" size="sm"
                        className="w-full text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10 bg-transparent disabled:opacity-50"
                        disabled={removingBg}
                        onClick={handleRemoveBg}>
                        {removingBg ? (
                          <><div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-1.5" /> Removing BG…</>
                        ) : (
                          <><Wand2 className="w-3.5 h-3.5 mr-1.5" /> Remove Background</>
                        )}
                      </Button>
                    )}
                    <button
                      className="w-full text-[10px] text-slate-500 hover:text-slate-300 transition-colors py-1 flex items-center justify-center gap-1"
                      onClick={() => setLeftTab("photos")}>
                      <Search className="w-3 h-3" /> Browse photo library
                    </button>
                  </div>
                </section>
              )}

              {/* Link editor */}
              {selectedElement.type === "link" && (
                <section>
                  <Label>Link</Label>
                  <div className="space-y-2">
                    <Input value={selectedElement.text ?? ""} onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                      className="text-xs bg-white/[0.04] border-white/[0.08] text-slate-300" placeholder="Link label" />
                    <Input value={selectedElement.href ?? ""} onChange={(e) => updateElement(selectedElement.id, { href: e.target.value })}
                      className="text-xs bg-white/[0.04] border-white/[0.08] text-slate-300" placeholder="https://" />
                  </div>
                </section>
              )}

              {/* Canvas BG */}
              <section>
                <Label>Canvas Background</Label>
                <div className="flex items-center gap-3">
                  <input type="color" value={bg.color} onChange={(e) => setBg({ ...bg, color: e.target.value, type: "solid" })} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                  <span className="text-xs text-slate-400 font-mono">{bg.color}</span>
                </div>
              </section>

              {/* Delete */}
              <button onClick={removeSelected}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete Element
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-5 py-4">
              {/* Empty state hint */}
              <div className="flex flex-col items-center text-center space-y-2 pt-4 pb-2">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <Pencil className="w-4 h-4 text-slate-600" />
                </div>
                <p className="text-xs text-slate-500">Select an element to edit it</p>
              </div>

              {/* Save design panel */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Save Design</p>
                <input
                  value={saveNameInput}
                  onChange={(e) => setSaveNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveCurrentDesign()}
                  placeholder={`Design ${savedDesigns.length + 1}`}
                  className="w-full h-9 text-xs bg-white/[0.06] border border-white/[0.10] rounded-lg px-3 text-white placeholder:text-slate-600 outline-none focus:border-white/25 transition-colors"
                />
                <button
                  onClick={async () => {
                    const token = localStorage.getItem("access_token");
                    const current = activeDesignId ? savedDesigns.find((d) => d.id === activeDesignId) : null;
                    if (current) {
                      try {
                        const res = await apiRequest<{ design: ApiDesign }>(`/api/designs/${current.id}`, {
                          method: "PUT",
                          headers: { Authorization: `Bearer ${token ?? ""}` },
                          body: JSON.stringify({ elements, bg, template_id: activeTemplate }),
                        });
                        setSavedDesigns((prev) => prev.map((d) => d.id === current.id ? apiDesignToSaved(res.design) : d));
                        await apiRequest(`/api/designs/${current.id}/activate`, { method: "POST", headers: { Authorization: `Bearer ${token ?? ""}` } });
                        setActiveDesignId(current.id);
                        setSavedDesigns((prev) => prev.map((d) => ({ ...d, isActive: d.id === current.id })));
                        toast.success(`"${current.name}" saved & live!`);
                      } catch { toast.error("Failed to save."); }
                    } else {
                      const name = saveNameInput.trim() || `Design ${savedDesigns.length + 1}`;
                      try {
                        const res = await apiRequest<{ design: ApiDesign }>("/api/designs", {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token ?? ""}` },
                          body: JSON.stringify({ name, elements, bg, template_id: activeTemplate }),
                        });
                        const saved = apiDesignToSaved(res.design);
                        setSavedDesigns((prev) => [saved, ...prev]);
                        setSaveNameInput("");
                        await apiRequest(`/api/designs/${saved.id}/activate`, { method: "POST", headers: { Authorization: `Bearer ${token ?? ""}` } });
                        setActiveDesignId(saved.id);
                        setSavedDesigns((prev) => prev.map((d) => ({ ...d, isActive: d.id === saved.id })));
                        toast.success(`"${name}" saved & live!`);
                      } catch { toast.error("Failed to save design."); }
                    }
                  }}
                  className="w-full py-2.5 rounded-lg bg-white text-slate-900 text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5">
                  <Save className="w-3.5 h-3.5" /> Save & Go Live
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Inspector Drawer ──────────────────────────────── */}
      <AnimatePresence>
        {mobileRightOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileRightOpen(false)} />
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 right-0 z-50 flex flex-col w-[280px] border-l border-white/[0.06] bg-[#141416] overflow-hidden md:hidden">
              <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                <div>
                  <p className="text-xs font-semibold text-white">Inspector</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{selectedElement ? selectedElement.type : "Select element"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedElement && (
                    <button onClick={duplicateSelected} title="Duplicate" className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-slate-400">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => setMobileRightOpen(false)} className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {selectedElement ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  {/* Geometry */}
                  <section>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Geometry</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["x","y","w","h"] as const).map((key) => (
                        <div key={key}>
                          <p className="text-[9px] text-slate-600 uppercase mb-1">{key}</p>
                          <Input type="number" value={selectedElement[key]}
                            onChange={(e) => updateElement(selectedElement.id, { [key]: Number(e.target.value) })}
                            className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white" />
                        </div>
                      ))}
                    </div>
                  </section>
                  {!["shape","divider","image"].includes(selectedElement.type) && (
                    <section>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Typography</p>
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500 w-12 shrink-0">Size</span>
                          <div className="flex items-center gap-1 flex-1">
                            <button className="w-6 h-6 rounded bg-white/[0.06] flex items-center justify-center" onClick={() => updateElement(selectedElement.id, { fontSize: Math.max(8, selectedElement.fontSize - 1) })}><Minus className="w-3 h-3" /></button>
                            <span className="text-xs text-white text-center flex-1">{selectedElement.fontSize}px</span>
                            <button className="w-6 h-6 rounded bg-white/[0.06] flex items-center justify-center" onClick={() => updateElement(selectedElement.id, { fontSize: selectedElement.fontSize + 1 })}><Plus className="w-3 h-3" /></button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500 w-12 shrink-0">Weight</span>
                          <select value={selectedElement.fontWeight} onChange={(e) => updateElement(selectedElement.id, { fontWeight: Number(e.target.value) as any })}
                            className="flex-1 h-7 text-xs rounded bg-white/[0.06] border border-white/[0.08] text-white px-2">
                            {[400,500,600,700,800,900].map((w) => <option key={w} value={w} className="bg-[#1a1a1e]">{w}</option>)}
                          </select>
                        </div>
                      </div>
                    </section>
                  )}
                  <section>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Color</p>
                    <div className="space-y-2.5">
                      {!["image","divider","shape"].includes(selectedElement.type) && (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500 w-10 shrink-0">Text</span>
                          <input type="color" value={selectedElement.color} onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" />
                          <span className="text-[10px] text-slate-500 font-mono">{selectedElement.color}</span>
                        </div>
                      )}
                      {["button","shape","divider","icon_row"].includes(selectedElement.type) && (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500 w-10 shrink-0">Fill</span>
                          <input type="color" value={selectedElement.background === "transparent" ? "#000000" : selectedElement.background} onChange={(e) => updateElement(selectedElement.id, { background: e.target.value })} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" />
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {COLOR_SWATCHES.map((c) => (
                          <button key={c} title={c}
                            onClick={() => {
                              if (["button","shape","divider","icon_row"].includes(selectedElement.type)) updateElement(selectedElement.id, { background: c });
                              else updateElement(selectedElement.id, { color: c });
                            }}
                            className="w-5 h-5 rounded-full border border-white/10 hover:scale-110 transition-transform shrink-0"
                            style={c === "transparent" ? { background: "conic-gradient(#aaa 90deg, white 90deg 180deg, #aaa 180deg 270deg, white 270deg)", backgroundSize: "8px 8px" } : { background: c }} />
                        ))}
                      </div>
                    </div>
                  </section>
                  {selectedElement.type === "image" && (
                    <section>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Image</p>
                      <div className="space-y-2">
                        <button onClick={() => uploadInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] text-slate-300 text-xs font-medium transition-colors">
                          <ImagePlus className="w-3.5 h-3.5" /> Upload Photo
                        </button>
                        <input
                          type="text"
                          value={selectedElement.src ?? ""}
                          onChange={(e) => updateElement(selectedElement.id, { src: e.target.value })}
                          placeholder="Paste image URL"
                          className="w-full h-8 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-white placeholder:text-slate-600 outline-none focus:border-white/20" />
                        {selectedElement.src && (
                          <button
                            disabled={removingBg}
                            onClick={handleRemoveBg}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-purple-300 border border-purple-500/30 hover:bg-purple-500/10 transition-colors disabled:opacity-50">
                            {removingBg ? (
                              <><div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> Removing BG…</>
                            ) : (
                              <><Wand2 className="w-3.5 h-3.5" /> Remove Background</>
                            )}
                          </button>
                        )}
                      </div>
                    </section>
                  )}
                  <section>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Appearance</p>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-500 w-12 shrink-0">Radius</span>
                        <input type="range" min={0} max={60} value={selectedElement.radius} onChange={(e) => updateElement(selectedElement.id, { radius: Number(e.target.value) })} className="flex-1 accent-white" />
                        <span className="text-[9px] text-slate-500 w-5">{selectedElement.radius}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-500 w-12 shrink-0">Opacity</span>
                        <input type="range" min={0} max={1} step={0.01} value={selectedElement.opacity} onChange={(e) => updateElement(selectedElement.id, { opacity: Number(e.target.value) })} className="flex-1 accent-white" />
                        <span className="text-[9px] text-slate-500 w-7">{Math.round(selectedElement.opacity * 100)}%</span>
                      </div>
                    </div>
                  </section>
                  <button onClick={() => { removeSelected(); setMobileRightOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Element
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <Pencil className="w-5 h-5 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-500">Tap an element on the canvas to edit it</p>
                  <button onClick={() => setMobileRightOpen(false)} className="px-4 py-2 rounded-lg bg-white/[0.06] text-slate-400 text-xs">Close</button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile Left Drawer (full panel) ─────────────────────── */}
      <AnimatePresence>
        {mobileLeftOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileLeftOpen(false)} />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 flex flex-col w-[72vw] max-w-[280px] border-r border-white/[0.06] bg-[#141416] overflow-hidden md:hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
                <span className="text-xs font-semibold text-white">Design Tools</span>
                <button onClick={() => setMobileLeftOpen(false)} className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex border-b border-white/[0.06] shrink-0">
                {["templates", "elements", "photos", "saved"].map((tab) => (
                  <button key={tab} onClick={() => setLeftTab(tab as "templates" | "elements" | "photos" | "saved")}
                    className={`flex-1 py-2.5 transition-colors relative ${leftTab === tab ? "text-white border-b-2 border-white bg-white/[0.03]" : "text-slate-500 hover:text-slate-300"}`}>
                    {tab === "templates" ? <LayoutTemplate className="w-5 h-5 mx-auto" />
                      : tab === "elements" ? <Plus className="w-5 h-5 mx-auto" />
                      : tab === "photos" ? <ImageIcon className="w-5 h-5 mx-auto" />
                      : <Bookmark className="w-5 h-5 mx-auto" />}
                    {tab === "saved" && savedDesigns.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-[7px] font-bold text-white flex items-center justify-center">{savedDesigns.length}</span>
                    )}
                  </button>
                ))}
              </div>
              {/* Reuse the same left panel scroll content inline */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {leftTab === "templates" && (
                  <>
                    <div className="flex gap-1 p-1 bg-white/[0.04] rounded-lg mb-2">
                      {["All", "Dark", "Light"].map((cat) => (
                        <button key={cat} onClick={() => setCategoryFilter(cat)} className={`flex-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${categoryFilter === cat ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}>{cat}</button>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {filteredTemplates.map((tpl) => (
                        <button key={tpl.id}
                          onClick={() => { setElements(applyTemplate(tpl)); setBg(tpl.bg); setActiveTemplate(tpl.id); setSelectedId(null); setMobileLeftOpen(false); }}
                          className={`w-full rounded-lg overflow-hidden border transition-all flex items-center px-2 py-2 gap-2 ${activeTemplate === tpl.id ? "border-white/60 bg-white/[0.06]" : "border-white/[0.08] hover:border-white/30 bg-white/[0.02]"}`}>
                          <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-xs font-bold text-white/80 uppercase">{tpl.name[0]}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-bold text-white/90 truncate">{tpl.name}</div>
                            <div className="text-[8px] text-white/40">{tpl.category}</div>
                          </div>
                          {activeTemplate === tpl.id && <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-slate-900" /></div>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {leftTab === "elements" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-2">Blocks</p>
                      <div className="grid grid-cols-3 gap-1">
                        {([
                          { type: "text" as ElementType,    icon: <Type className="w-4 h-4" />,      label: "Text" },
                          { type: "button" as ElementType,  icon: <CreditCard className="w-4 h-4" />, label: "Button" },
                          { type: "link" as ElementType,    icon: <LinkIcon className="w-4 h-4" />,   label: "Link" },
                          { type: "image" as ElementType,   icon: <Camera className="w-4 h-4" />,     label: "Image" },
                          { type: "divider" as ElementType, icon: <Minus className="w-4 h-4" />,      label: "Divider" },
                          { type: "shape" as ElementType,   icon: <Maximize2 className="w-4 h-4" />,  label: "Shape" },
                        ]).map(({ type, icon, label }) => (
                          <button key={type} onClick={() => { addElement(type); setMobileLeftOpen(false); }}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors">
                            <span className="text-slate-400">{icon}</span>
                            <span className="text-[9px] text-slate-500">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-2">Shape Presets</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { label: "Circle",     w: 100, h: 100, radius: 999, bg: "rgba(99,102,241,0.18)" },
                          { label: "Pill",       w: 180, h: 44,  radius: 999, bg: "rgba(34,197,94,0.15)"  },
                          { label: "Card",       w: 280, h: 70,  radius: 16,  bg: "rgba(255,255,255,0.06)" },
                          { label: "Accent Bar", w: 240, h: 4,   radius: 2,   bg: "rgba(59,130,246,0.6)"  },
                        ].map(({ label, w, h, radius, bg: shapeBg }) => (
                          <button key={label}
                            onClick={() => {
                              const el = createElement("shape", 60 + Math.random() * 80, 80 + Math.random() * 100);
                              el.w = w; el.h = h; el.radius = radius; el.background = shapeBg;
                              setElements((prev) => [...prev, el]);
                              setSelectedId(el.id);
                              setMobileLeftOpen(false);
                            }}
                            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors">
                            <div className="w-8 h-5 flex items-center justify-center">
                              <div style={{ width: Math.min(28, w / 6), height: Math.min(20, h / 6), borderRadius: Math.min(radius, 8), background: shapeBg.replace(/[\d.]+\)$/, "0.8)") }} />
                            </div>
                            <span className="text-[9px] font-medium text-slate-400">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-2">Quick Contact Icons</p>
                      <div className="grid grid-cols-3 gap-1">
                        {ICON_PRESETS.map(({ Icon, color, text, iconName, label }) => (
                          <button key={iconName}
                            onClick={() => {
                              const el = createElement("icon_row", 55, 100 + (elements.length % 12) * 52);
                              el.text = text; el.iconName = iconName; el.iconColor = color; el.w = 280; el.h = 44;
                              el.background = color + "18"; el.radius = 10; el.fontSize = 13; el.fontWeight = 500; el.color = "#e2e8f0";
                              setElements((prev) => [...prev, el]);
                              setSelectedId(el.id);
                              setMobileLeftOpen(false);
                            }}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.04] transition-colors">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + "22" }}>
                              <Icon className="w-3.5 h-3.5" style={{ color }} />
                            </div>
                            <span className="text-[8px] text-slate-500">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {leftTab === "photos" && (
                  <div className="space-y-3">
                    <button onClick={() => photosUploadRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] text-slate-300 text-xs font-medium transition-colors">
                      <Upload className="w-3.5 h-3.5" /> Upload Image
                    </button>
                    <div className="flex gap-1.5">
                      <input value={photoQuery} onChange={(e) => setPhotoQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && searchPhotos()}
                        placeholder="Search photos…"
                        className="flex-1 h-8 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-white placeholder:text-slate-600 outline-none focus:border-white/20" />
                      <button onClick={searchPhotos} disabled={photoLoading}
                        className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-40">
                        {photoLoading ? <div className="w-3 h-3 border-2 border-slate-500 border-t-slate-200 rounded-full animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(photoResults.length > 0 ? photoResults : DEMO_PHOTOS).map((p) => (
                        <div key={p.id} className="relative group rounded-lg overflow-hidden cursor-pointer"
                          onClick={() => {
                            const el = createElement("image", 60, 60);
                            el.src = p.full; el.w = 180; el.h = 220; el.radius = 10;
                            setElements((prev) => [...prev, el]);
                            setSelectedId(el.id);
                            setMobileLeftOpen(false);
                            toast.success("Photo added!");
                          }}>
                          <img src={p.thumb} alt={p.author} className="w-full h-20 object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Plus className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {leftTab === "saved" && (
                  <div className="space-y-3">
                    <input value={saveNameInput} onChange={(e) => setSaveNameInput(e.target.value)} placeholder={`Design ${savedDesigns.length + 1}`}
                      className="w-full h-8 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-white placeholder:text-slate-600 outline-none" />
                    <button onClick={saveCurrentDesign} className="w-full py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold transition-colors">Save to Cloud</button>
                    {savedDesigns.map((design) => {
                      const isActive = design.id === activeDesignId;
                      return (
                        <div key={design.id} className={`rounded-xl border p-3 space-y-2 ${isActive ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/[0.06] bg-white/[0.03]"}`}>
                          <p className="text-xs font-semibold text-white truncate">{design.name}</p>
                          <p className="text-[9px] text-slate-600">{new Date(design.timestamp).toLocaleDateString()}</p>
                          <div className="flex gap-1.5">
                            <button onClick={() => { loadDesign(design); setMobileLeftOpen(false); }} className="flex-1 py-1.5 rounded-lg bg-white/[0.06] text-[10px] font-medium text-slate-300">Load</button>
                            <button onClick={() => markDesignActive(design.id)} className={`w-7 h-7 rounded-lg flex items-center justify-center ${isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.06] text-slate-500"}`}><BookmarkCheck className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteDesign(design.id)} className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Share Contact Modal — shown in preview mode */}
      {shareModalOpen && (
        <ShareContactModal
          onClose={() => setShareModalOpen(false)}
          cardOwnerName={cardOwnerName}
          profileSlug={profileSlug}
        />
      )}
    </div>
  );
}
