import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PhoneMockup from "@/components/PhoneMockup";
import MiniProfileCard from "@/components/MiniProfileCard";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";
import {
  User, Link2, Palette, Camera, Plus, Trash2, GripVertical,
  Phone, Mail, MessageCircle, Globe, Linkedin, Twitter, Instagram, WandSparkles,
  Undo2, Redo2, Image as ImageIcon, Layers3
} from "lucide-react";
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
}

const platformIcons: Record<string, any> = {
  LinkedIn: Linkedin,
  Twitter: Twitter,
  Instagram: Instagram,
  Website: Globe,
  Phone: Phone,
  Email: Mail,
  WhatsApp: MessageCircle,
};

const backgroundStyles = [
  { name: "Noir", value: "#0f172a" },
  { name: "Emerald", value: "linear-gradient(135deg,#0f766e,#22c55e)" },
  { name: "Ocean", value: "linear-gradient(135deg,#0f172a,#0ea5e9)" },
  { name: "Sunrise", value: "linear-gradient(135deg,#f97316,#ef4444)" },
  { name: "Royal", value: "linear-gradient(135deg,#1e1b4b,#312e81)" },
  { name: "Slate", value: "linear-gradient(135deg,#111827,#374151)" },
];

const templates = [
  { name: "Executive", coverColor: "#111827", buttonStyle: "rounded-lg", fontStyle: "Modern" },
  { name: "Creator", coverColor: "linear-gradient(135deg,#7c3aed,#ec4899)", buttonStyle: "rounded-full", fontStyle: "Modern" },
  { name: "Minimal", coverColor: "#1f2937", buttonStyle: "rounded-none", fontStyle: "Classic" },
  { name: "Bold", coverColor: "linear-gradient(135deg,#0f766e,#22c55e)", buttonStyle: "rounded-full", fontStyle: "Classic" },
  { name: "Corporate", coverColor: "linear-gradient(135deg,#0b1220,#1d4ed8)", buttonStyle: "rounded-lg", fontStyle: "Classic" },
  { name: "Luxury", coverColor: "linear-gradient(135deg,#111827,#b45309)", buttonStyle: "rounded-full", fontStyle: "Classic" },
  { name: "Monochrome", coverColor: "linear-gradient(135deg,#0f172a,#334155)", buttonStyle: "rounded-none", fontStyle: "Modern" },
  { name: "Neon", coverColor: "linear-gradient(135deg,#0f172a,#06b6d4)", buttonStyle: "rounded-full", fontStyle: "Modern" },
];

const defaultSectionOrder = ["identity", "contact", "social"];
const defaultCanvasBlocks = ["photo", "identity", "contact", "links", "background"];

type StudioProfile = {
  avatar: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  phone: string;
  email: string;
  whatsapp: string;
  website: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  location: string;
  coverColor: string;
  buttonStyle: string;
  fontStyle: string;
  backgroundImageUrl: string;
  backgroundOverlayOpacity: number;
  backgroundBlurStrength: number;
  nameSize: number;
  titleSize: number;
  bioSize: number;
  photoSize: number;
  photoOffsetY: number;
  nameBold: boolean;
  titleBold: boolean;
  bioBold: boolean;
  bodyBackgroundColor: string;
  bodyTextColor: string;
  bodyBackgroundImageUrl: string;
  actionHoverColor: string;
  showExchangeContact: boolean;
  layoutMode: "stack" | "freeform";
  sectionPositions: Record<string, { x: number; y: number }>;
};

type StudioSnapshot = {
  profile: StudioProfile;
  links: SocialLink[];
  sectionOrder: string[];
  canvasBlocks: string[];
  contactActionOrder: string[];
  enabledContactActions: Record<string, boolean>;
};

type SortableShellProps = {
  id: string;
  className?: string;
  children: (params: { attributes: any; listeners: any; isDragging: boolean }) => ReactNode;
};

const SortableShell = ({ id, className, children }: SortableShellProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
      }}
    >
      {children({ attributes, listeners, isDragging })}
    </div>
  );
};

const moveItem = <T,>(items: T[], from: number, to: number): T[] => {
  const updated = [...items];
  const [moved] = updated.splice(from, 1);
  updated.splice(to, 0, moved);
  return updated;
};

const EditProfile = () => {
  const [slug, setSlug] = useState("demo");
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<StudioProfile>({
    avatar: "",
    name: "",
    title: "",
    company: "",
    bio: "",
    phone: "",
    email: "",
    whatsapp: "",
    website: "",
    linkedin: "",
    twitter: "",
    instagram: "",
    location: "",
    coverColor: "#111111",
    buttonStyle: "rounded-lg",
    fontStyle: "Modern",
    backgroundImageUrl: "",
    backgroundOverlayOpacity: 20,
    backgroundBlurStrength: 0,
    nameSize: 16,
    titleSize: 12,
    bioSize: 12,
    photoSize: 68,
    photoOffsetY: 0,
    nameBold: true,
    titleBold: false,
    bioBold: false,
    bodyBackgroundColor: "#ffffff",
    bodyTextColor: "#0f172a",
    bodyBackgroundImageUrl: "",
    actionHoverColor: "#22c55e",
    showExchangeContact: true,
    layoutMode: "stack",
    sectionPositions: {
      identity: { x: 0, y: 0 },
      contact: { x: 0, y: 100 },
      social: { x: 0, y: 154 },
    },
  });

  const [links, setLinks] = useState<SocialLink[]>([]);
  const [sectionOrder, setSectionOrder] = useState<string[]>(defaultSectionOrder);
  const [canvasBlocks, setCanvasBlocks] = useState<string[]>(defaultCanvasBlocks);
  const [draggingLinkId, setDraggingLinkId] = useState<string | null>(null);
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [draggingCanvasBlockId, setDraggingCanvasBlockId] = useState<string | null>(null);
  const [contactActionOrder, setContactActionOrder] = useState<string[]>(["phone", "email", "whatsapp", "website"]);
  const [draggingContactActionId, setDraggingContactActionId] = useState<string | null>(null);
  const [enabledContactActions, setEnabledContactActions] = useState<Record<string, boolean>>({
    phone: true,
    email: true,
    whatsapp: true,
    website: true,
  });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [historyPast, setHistoryPast] = useState<StudioSnapshot[]>([]);
  const [historyFuture, setHistoryFuture] = useState<StudioSnapshot[]>([]);
  const [readyForHistory, setReadyForHistory] = useState(false);
  const [previewRevision, setPreviewRevision] = useState(0);

  const [activeTab, setActiveTab] = useState("profile");
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

  const sanitizeSlug = (value: string) => {
    const trimmed = (value || "").trim();
    if (!trimmed) {
      return "profile";
    }
    const withoutProtocol = trimmed.replace(/^https?:\/\//i, "");
    const firstPath = withoutProtocol.split("/")[0];
    return firstPath.replace(/\s+/g, "-").toLowerCase();
  };

  const normalizeWebsite = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const readStoredValue = (key: string, fallback: string) => localStorage.getItem(key) ?? fallback;
  const readStoredNumber = (key: string, fallback: number) => {
    const stored = localStorage.getItem(key);
    if (stored === null) {
      return fallback;
    }
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const readStoredBoolean = (key: string, fallback: boolean) => {
    const stored = localStorage.getItem(key);
    if (stored === null) {
      return fallback;
    }
    return stored === "1" || stored.toLowerCase() === "true";
  };
  const safeParseJson = <T,>(value: string | null): T | null => {
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  };

  const makeSnapshot = (): StudioSnapshot => ({
    profile: { ...profile },
    links: links.map((item) => ({ ...item })),
    sectionOrder: [...sectionOrder],
    canvasBlocks: [...canvasBlocks],
    contactActionOrder: [...contactActionOrder],
    enabledContactActions: { ...enabledContactActions },
  });

  const applySnapshot = (snapshot: StudioSnapshot, recordHistory = true) => {
    if (recordHistory && readyForHistory) {
      setHistoryPast((past) => [...past.slice(-49), makeSnapshot()]);
      setHistoryFuture([]);
    }

    setProfile(snapshot.profile);
    setLinks(snapshot.links);
    setSectionOrder(snapshot.sectionOrder);
    setCanvasBlocks(snapshot.canvasBlocks);
    setContactActionOrder(snapshot.contactActionOrder);
    setEnabledContactActions(snapshot.enabledContactActions);
    localStorage.setItem("profile_studio_section_order", JSON.stringify(snapshot.sectionOrder));
    localStorage.setItem("profile_studio_canvas_blocks", JSON.stringify(snapshot.canvasBlocks));
    localStorage.setItem("profile_studio_contact_actions", JSON.stringify(snapshot.contactActionOrder));
    localStorage.setItem("profile_studio_enabled_actions", JSON.stringify(snapshot.enabledContactActions));
  };

  const commitState = (
    updater: (current: StudioSnapshot) => StudioSnapshot,
    options: { recordHistory?: boolean } = {}
  ) => {
    const current = makeSnapshot();
    const next = updater(current);
    const shouldRecord = options.recordHistory !== false;
    applySnapshot(next, shouldRecord);
  };

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("access_token");
      let data: { user?: { first_name: string; last_name: string } | null; profile?: any } = {};

      try {
        data = await apiRequest<{ user: { first_name: string; last_name: string }; profile: any }>("/api/auth/me", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch {
        const fallback = await apiRequest<{ profile: any }>("/api/profile/me", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        data = { profile: fallback.profile, user: null };
      }

      const incomingSlug = sanitizeSlug(data.profile?.public_slug || "demo");
      setSlug(incomingSlug);
      setProfile({
        avatar: data.profile?.photo_url || "",
        name: data.user ? `${data.user.first_name} ${data.user.last_name}`.trim() : "",
        title: data.profile?.title || "",
        company: "",
        bio: data.profile?.bio || "",
        phone: data.profile?.phone || "",
        email: data.profile?.email_public || "",
        whatsapp: data.profile?.whatsapp || "",
        website: data.profile?.website || "",
        linkedin: data.profile?.linkedin_url || "",
        twitter: data.profile?.twitter_url || "",
        instagram: data.profile?.instagram_url || "",
        location: data.profile?.location || "",
        coverColor: data.profile?.cover_color || "#111111",
        buttonStyle: data.profile?.button_style || "rounded-lg",
        fontStyle: data.profile?.font_style || "Modern",
        backgroundImageUrl: data.profile?.background_image_url || "",
        backgroundOverlayOpacity: Number(data.profile?.background_overlay_opacity ?? 20),
        backgroundBlurStrength: Number(data.profile?.background_blur_strength ?? 0),
        nameSize: Number(data.profile?.name_size ?? readStoredNumber("profile_studio_name_size", 16)),
        titleSize: Number(data.profile?.title_size ?? readStoredNumber("profile_studio_title_size", 12)),
        bioSize: Number(data.profile?.bio_size ?? readStoredNumber("profile_studio_bio_size", 12)),
        photoSize: Number(data.profile?.photo_size ?? readStoredNumber("profile_studio_photo_size", 68)),
        photoOffsetY: Number(data.profile?.photo_offset_y ?? readStoredNumber("profile_studio_photo_offset_y", 0)),
        nameBold: data.profile?.name_bold ?? readStoredBoolean("profile_studio_name_bold", true),
        titleBold: data.profile?.title_bold ?? readStoredBoolean("profile_studio_title_bold", false),
        bioBold: data.profile?.bio_bold ?? readStoredBoolean("profile_studio_bio_bold", false),
        bodyBackgroundColor: data.profile?.body_background_color || readStoredValue("profile_studio_body_bg_color", "#ffffff"),
        bodyTextColor: data.profile?.body_text_color || readStoredValue("profile_studio_body_text_color", "#0f172a"),
        bodyBackgroundImageUrl: data.profile?.body_background_image_url || readStoredValue("profile_studio_body_bg_image", ""),
        actionHoverColor: data.profile?.action_hover_color || readStoredValue("profile_studio_hover_color", "#22c55e"),
        showExchangeContact: data.profile?.show_exchange_contact ?? readStoredBoolean("profile_studio_exchange", true),
        layoutMode: (data.profile?.layout_mode === "freeform" ? "freeform" : readStoredValue("profile_studio_layout_mode", "stack")) as "stack" | "freeform",
        sectionPositions: (() => {
          if (typeof data.profile?.section_positions === "string" && data.profile.section_positions.trim()) {
            try {
              const parsed = JSON.parse(data.profile.section_positions);
              if (parsed && typeof parsed === "object") {
                return parsed;
              }
            } catch {
              // Fall through to local storage/default positions.
            }
          }

          const stored = localStorage.getItem("profile_studio_section_positions");
          if (stored) {
            try {
              const parsedStored = JSON.parse(stored);
              if (parsedStored && typeof parsedStored === "object") {
                return parsedStored;
              }
            } catch {
              // Fall through to defaults.
            }
          }

          return {
            identity: { x: 0, y: 0 },
            contact: { x: 0, y: 100 },
            social: { x: 0, y: 154 },
          };
        })(),
      });

      try {
        const parsedLinks = typeof data.profile?.social_links_json === "string" ? JSON.parse(data.profile.social_links_json) : null;
        setLinks(Array.isArray(parsedLinks) && parsedLinks.length > 0 ? parsedLinks : [
          { id: "1", platform: "LinkedIn", url: data.profile?.linkedin_url || "", icon: "LinkedIn" },
          { id: "2", platform: "Twitter", url: data.profile?.twitter_url || "", icon: "Twitter" },
          { id: "3", platform: "Instagram", url: data.profile?.instagram_url || "", icon: "Instagram" },
        ]);
      } catch {
        setLinks([
          { id: "1", platform: "LinkedIn", url: data.profile?.linkedin_url || "", icon: "LinkedIn" },
          { id: "2", platform: "Twitter", url: data.profile?.twitter_url || "", icon: "Twitter" },
          { id: "3", platform: "Instagram", url: data.profile?.instagram_url || "", icon: "Instagram" },
        ]);
      }

      if (typeof data.profile?.section_order === "string" && data.profile.section_order.trim()) {
        try {
          const parsedFromBackend = JSON.parse(data.profile.section_order);
          if (Array.isArray(parsedFromBackend) && parsedFromBackend.length === defaultSectionOrder.length) {
            setSectionOrder(parsedFromBackend);
          }
        } catch {
          // Ignore malformed saved section order and continue with defaults.
        }
      }

      const savedOrder = safeParseJson<string[]>(localStorage.getItem("profile_studio_section_order"));
      if (Array.isArray(savedOrder) && savedOrder.length === defaultSectionOrder.length) {
        setSectionOrder(savedOrder);
      }

      const savedCanvas = safeParseJson<string[]>(localStorage.getItem("profile_studio_canvas_blocks"));
      if (Array.isArray(savedCanvas) && savedCanvas.length >= 3) {
        setCanvasBlocks(savedCanvas);
      }

      const savedContactActions = safeParseJson<string[]>(localStorage.getItem("profile_studio_contact_actions"));
      if (Array.isArray(savedContactActions) && savedContactActions.length > 0) {
        setContactActionOrder(savedContactActions);
      }

      const savedEnabledActions = safeParseJson<Record<string, boolean>>(localStorage.getItem("profile_studio_enabled_actions"));
      if (savedEnabledActions && typeof savedEnabledActions === "object") {
        setEnabledContactActions(savedEnabledActions);
      }

      if (typeof data.profile?.contact_action_order === "string" && data.profile.contact_action_order.trim()) {
        try {
          const parsedContactOrder = JSON.parse(data.profile.contact_action_order);
          if (Array.isArray(parsedContactOrder) && parsedContactOrder.length > 0) {
            setContactActionOrder(parsedContactOrder);
          }
        } catch {
          // Keep current order if the saved value is malformed.
        }
      }

      if (typeof data.profile?.enabled_contact_actions === "string" && data.profile.enabled_contact_actions.trim()) {
        try {
          const parsedEnabled = JSON.parse(data.profile.enabled_contact_actions);
          if (parsedEnabled && typeof parsedEnabled === "object") {
            setEnabledContactActions(parsedEnabled);
          }
        } catch {
          // Keep current visibility settings if the saved value is malformed.
        }
      }

      setHistoryPast([]);
      setHistoryFuture([]);
      setReadyForHistory(true);
    };

    loadProfile().catch((error) => {
      // Keep studio usable even when profile endpoints are temporarily unavailable.
      setReadyForHistory(true);
      const localSlug = localStorage.getItem("profile_studio_slug");
      if (localSlug) {
        setSlug(sanitizeSlug(localSlug));
      }
      if (error instanceof Error) {
        console.warn("Profile Studio load fallback:", error.message);
      }
    });
  }, []);

  const update = (key: keyof StudioProfile, value: string | number | boolean) => {
    commitState((current) => ({
      ...current,
      profile: { ...current.profile, [key]: value },
    }));
  };

  const addLink = () => commitState((current) => ({
    ...current,
    links: [...current.links, { id: Date.now().toString(), platform: "", url: "", icon: "" }],
  }));
  const removeLink = (id: string) => commitState((current) => ({
    ...current,
    links: current.links.filter((item) => item.id !== id),
  }));
  const updateLink = (id: string, field: string, value: string) =>
    commitState((current) => ({
      ...current,
      links: current.links.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));

  const reorderLink = (targetId: string) => {
    if (!draggingLinkId || draggingLinkId === targetId) {
      return;
    }
    const from = links.findIndex((item) => item.id === draggingLinkId);
    const to = links.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) {
      return;
    }
    commitState((current) => ({
      ...current,
      links: moveItem(current.links, from, to),
    }));
  };

  const onLinkDragStart = (event: React.DragEvent<HTMLButtonElement>, linkId: string) => {
    setDraggingLinkId(linkId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", linkId);
  };

  const handleCanvasDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    const oldIndex = canvasBlocks.indexOf(activeId);
    const newIndex = canvasBlocks.indexOf(overId);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    commitState((current) => ({
      ...current,
      canvasBlocks: arrayMove(current.canvasBlocks, oldIndex, newIndex),
    }));
  };

  const sectionMeta: Record<string, { label: string; detail: string }> = {
    identity: { label: "Identity", detail: "Name, role, bio" },
    contact: { label: "Contact Actions", detail: "Call, email, WhatsApp" },
    social: { label: "Social Links", detail: "LinkedIn, X, Instagram" },
  };

  const reorderSection = (targetId: string) => {
    if (!draggingSectionId || draggingSectionId === targetId) {
      return;
    }
    const from = sectionOrder.findIndex((item) => item === draggingSectionId);
    const to = sectionOrder.findIndex((item) => item === targetId);
    if (from < 0 || to < 0) {
      return;
    }
    commitState((current) => ({
      ...current,
      sectionOrder: moveItem(current.sectionOrder, from, to),
    }));
  };

  const onSectionDragStart = (event: React.DragEvent<HTMLDivElement>, sectionId: string) => {
    setDraggingSectionId(sectionId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", sectionId);
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sectionOrder.indexOf(String(active.id));
    const newIndex = sectionOrder.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    commitState((current) => ({
      ...current,
      sectionOrder: arrayMove(current.sectionOrder, oldIndex, newIndex),
    }));
  };

  const reorderCanvasBlock = (targetId: string) => {
    if (!draggingCanvasBlockId || draggingCanvasBlockId === targetId) {
      return;
    }
    const from = canvasBlocks.findIndex((item) => item === draggingCanvasBlockId);
    const to = canvasBlocks.findIndex((item) => item === targetId);
    if (from < 0 || to < 0) {
      return;
    }
    commitState((current) => ({
      ...current,
      canvasBlocks: moveItem(current.canvasBlocks, from, to),
    }));
  };

  const onCanvasDragStart = (event: React.DragEvent<HTMLDivElement>, blockId: string) => {
    setDraggingCanvasBlockId(blockId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", blockId);
  };

  const handleContactDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = contactActionOrder.indexOf(String(active.id));
    const newIndex = contactActionOrder.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    commitState((current) => ({
      ...current,
      contactActionOrder: arrayMove(current.contactActionOrder, oldIndex, newIndex),
    }));
  };

  const reorderContactAction = (targetId: string) => {
    if (!draggingContactActionId || draggingContactActionId === targetId) {
      return;
    }
    const from = contactActionOrder.findIndex((item) => item === draggingContactActionId);
    const to = contactActionOrder.findIndex((item) => item === targetId);
    if (from < 0 || to < 0) {
      return;
    }
    commitState((current) => ({
      ...current,
      contactActionOrder: moveItem(current.contactActionOrder, from, to),
    }));
  };

  const onContactActionDragStart = (event: React.DragEvent<HTMLDivElement>, actionId: string) => {
    setDraggingContactActionId(actionId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", actionId);
  };

  const handleLinkDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = links.findIndex((item) => `link:${item.id}` === String(active.id));
    const newIndex = links.findIndex((item) => `link:${item.id}` === String(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    commitState((current) => ({
      ...current,
      links: arrayMove(current.links, oldIndex, newIndex),
    }));
  };

  const toggleContactAction = (actionId: string) => {
    commitState((current) => ({
      ...current,
      enabledContactActions: {
        ...current.enabledContactActions,
        [actionId]: current.enabledContactActions[actionId] === false,
      },
    }));
  };

  const updateSectionPosition = (sectionId: string, position: { x: number; y: number }) => {
    commitState((current) => ({
      ...current,
      profile: {
        ...current.profile,
        sectionPositions: {
          ...current.profile.sectionPositions,
          [sectionId]: position,
        },
      },
    }));
  };

  const applyTemplate = (template: { coverColor: string; buttonStyle: string; fontStyle: string; name: string }) => {
    commitState((current) => ({
      ...current,
      profile: {
        ...current.profile,
        coverColor: template.coverColor,
        buttonStyle: template.buttonStyle,
        fontStyle: template.fontStyle,
      },
    }));
    toast.success(`${template.name} template applied`, { duration: 2000 });
  };

  const applyBackgroundImageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        toast.error("Failed to read image file", { duration: 2000 });
        return;
      }
      update("backgroundImageUrl", result);
      toast.success("Background image selected", { duration: 2000 });
    };
    reader.readAsDataURL(file);
  };

  const applyAvatarFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        toast.error("Failed to read image file", { duration: 2000 });
        return;
      }
      update("avatar", result);
      toast.success("Profile image selected", { duration: 2000 });
    };
    reader.readAsDataURL(file);
  };

  const handleUndo = () => {
    if (historyPast.length === 0) {
      return;
    }
    const previous = historyPast[historyPast.length - 1];
    const current = makeSnapshot();
    setHistoryPast((past) => past.slice(0, -1));
    setHistoryFuture((future) => [current, ...future].slice(0, 50));
    applySnapshot(previous, false);
  };

  const handleRedo = () => {
    if (historyFuture.length === 0) {
      return;
    }
    const next = historyFuture[0];
    const current = makeSnapshot();
    setHistoryPast((past) => [...past.slice(-49), current]);
    setHistoryFuture((future) => future.slice(1));
    applySnapshot(next, false);
  };

  const canvasMeta: Record<string, { title: string; subtitle: string }> = {
    photo: { title: "Profile Photo", subtitle: "Avatar and identity image" },
    identity: { title: "Basic Information", subtitle: "Name, title, bio and location" },
    contact: { title: "Contact Channels", subtitle: "Phone, email, WhatsApp, website" },
    links: { title: "Social Links", subtitle: "Drag, edit, and arrange links" },
    background: { title: "Background Layer", subtitle: "Image, overlay, blur, gradient" },
  };

  const resolveSlugForSave = async (token: string | null) => {
    const current = sanitizeSlug(slug);
    if (current !== "demo") {
      return current;
    }

    const storedSlug = sanitizeSlug(localStorage.getItem("profile_studio_slug") || "");
    if (storedSlug && storedSlug !== "demo") {
      return storedSlug;
    }

    try {
      const response = await apiRequest<{ profile?: { public_slug?: string | null } }>("/api/profile/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const serverSlug = sanitizeSlug(response.profile?.public_slug || "");
      if (serverSlug && serverSlug !== "demo") {
        setSlug(serverSlug);
        return serverSlug;
      }
    } catch {
      // Fall back to current slug candidate below.
    }

    return current;
  };

  const buildSavePayload = (resolvedSlug: string, includeExtendedFields: boolean) => {
    const basePayload: Record<string, unknown> = {
      public_slug: resolvedSlug,
      title: profile.title,
      bio: profile.bio,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      email_public: profile.email,
      website: normalizeWebsite(profile.website),
      location: profile.location,
      photo_url: profile.avatar || null,
      linkedin_url: links.find((l) => l.platform.toLowerCase() === "linkedin")?.url || profile.linkedin,
      twitter_url: links.find((l) => l.platform.toLowerCase() === "twitter")?.url || profile.twitter,
      instagram_url: links.find((l) => l.platform.toLowerCase() === "instagram")?.url || profile.instagram,
      cover_color: profile.coverColor,
      button_style: profile.buttonStyle,
      font_style: profile.fontStyle,
      background_image_url: profile.backgroundImageUrl || null,
      background_overlay_opacity: profile.backgroundOverlayOpacity,
      background_blur_strength: profile.backgroundBlurStrength,
      section_order: JSON.stringify(sectionOrder),
    };

    if (!includeExtendedFields) {
      return basePayload;
    }

    return {
      ...basePayload,
      social_links_json: JSON.stringify(links),
      contact_action_order: JSON.stringify(contactActionOrder),
      enabled_contact_actions: JSON.stringify(enabledContactActions),
      name_size: profile.nameSize,
      title_size: profile.titleSize,
      bio_size: profile.bioSize,
      photo_size: profile.photoSize,
      photo_offset_y: profile.photoOffsetY,
      name_bold: profile.nameBold,
      title_bold: profile.titleBold,
      bio_bold: profile.bioBold,
      body_background_color: profile.bodyBackgroundColor,
      body_text_color: profile.bodyTextColor,
      body_background_image_url: profile.bodyBackgroundImageUrl || null,
      action_hover_color: profile.actionHoverColor,
      show_exchange_contact: profile.showExchangeContact,
      layout_mode: profile.layoutMode,
      section_positions: JSON.stringify(profile.sectionPositions),
    };
  };


  const saveProfile = async (showToast: boolean) => {
    try {
      setSaveState("saving");
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const resolvedSlug = await resolveSlugForSave(token);

      try {
        await apiRequest("/api/profile/me/update", {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(buildSavePayload(resolvedSlug, true)),
        });
      } catch (fullSaveError) {
        // Compatibility retry for environments where backend schema is behind frontend fields.
        await apiRequest("/api/profile/me/update", {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(buildSavePayload(resolvedSlug, false)),
        });

        if (showToast && fullSaveError instanceof Error) {
          toast.message("Saved with basic compatibility mode");
        }
      }

      if (resolvedSlug !== slug) {
        setSlug(resolvedSlug);
      }

      localStorage.setItem("profile_studio_name_size", String(profile.nameSize));
      localStorage.setItem("profile_studio_title_size", String(profile.titleSize));
      localStorage.setItem("profile_studio_bio_size", String(profile.bioSize));
      localStorage.setItem("profile_studio_photo_size", String(profile.photoSize));
      localStorage.setItem("profile_studio_photo_offset_y", String(profile.photoOffsetY));
      localStorage.setItem("profile_studio_name_bold", profile.nameBold ? "1" : "0");
      localStorage.setItem("profile_studio_title_bold", profile.titleBold ? "1" : "0");
      localStorage.setItem("profile_studio_bio_bold", profile.bioBold ? "1" : "0");
      localStorage.setItem("profile_studio_body_bg_color", profile.bodyBackgroundColor);
      localStorage.setItem("profile_studio_body_text_color", profile.bodyTextColor);
      localStorage.setItem("profile_studio_body_bg_image", profile.bodyBackgroundImageUrl || "");
      localStorage.setItem("profile_studio_hover_color", profile.actionHoverColor);
      localStorage.setItem("profile_studio_exchange", profile.showExchangeContact ? "1" : "0");
      localStorage.setItem("profile_studio_layout_mode", profile.layoutMode);
      localStorage.setItem("profile_studio_section_positions", JSON.stringify(profile.sectionPositions));
      localStorage.setItem("profile_studio_contact_actions", JSON.stringify(contactActionOrder));
      localStorage.setItem("profile_studio_enabled_actions", JSON.stringify(enabledContactActions));
      localStorage.setItem("profile_studio_social_links", JSON.stringify(links));
      localStorage.setItem("profile_studio_slug", sanitizeSlug(resolvedSlug));

      setSaveState("saved");
      if (showToast) {
        toast.success("Profile saved successfully", { duration: 2000 });
      }
    } catch (error) {
      setSaveState("error");
      if (showToast) {
        toast.error(error instanceof Error ? error.message : "Failed to save profile", { duration: 2000 });
      }
    }
  };

  const handleSave = async () => {
    await saveProfile(true);
  };

  useEffect(() => {
    if (!readyForHistory) {
      return;
    }

    const timer = setTimeout(() => {
      saveProfile(false).catch(() => undefined);
    }, 800);

    return () => clearTimeout(timer);
  }, [
    profile,
    links,
    sectionOrder,
    contactActionOrder,
    enabledContactActions,
    readyForHistory,
  ]);

  // Force preview to update immediately when state changes
  useEffect(() => {
    setPreviewRevision((prev) => prev + 1);
  }, [
    profile,
    links,
    sectionOrder,
    contactActionOrder,
    enabledContactActions,
  ]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-3rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Profile Studio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Canva-style editor for your digital business card</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleUndo} disabled={historyPast.length === 0}>
            <Undo2 className="w-3.5 h-3.5 mr-1.5" /> Undo
          </Button>
          <Button variant="outline" size="sm" onClick={handleRedo} disabled={historyFuture.length === 0}>
            <Redo2 className="w-3.5 h-3.5 mr-1.5" /> Redo
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`/u/${encodeURIComponent(sanitizeSlug(slug))}`, '_blank')}>
            Preview
          </Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleSave}>
            Publish Changes
          </Button>
          <div className="flex items-center px-2 text-xs text-muted-foreground">
            {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : saveState === "error" ? "Save failed" : ""}
          </div>
        </div>
      </div>

      <div className="flex gap-8 h-[calc(100%-5rem)]">
        {/* Left: Editor panels */}
        <div className="flex-1 overflow-y-auto pr-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4 mb-6">
              <TabsTrigger value="studio" className="gap-1.5 text-xs">
                <Layers3 className="w-3.5 h-3.5" /> Studio
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-1.5 text-xs">
                <User className="w-3.5 h-3.5" /> Profile
              </TabsTrigger>
              <TabsTrigger value="links" className="gap-1.5 text-xs">
                <Link2 className="w-3.5 h-3.5" /> Links
              </TabsTrigger>
              <TabsTrigger value="design" className="gap-1.5 text-xs">
                <Palette className="w-3.5 h-3.5" /> Design
              </TabsTrigger>
            </TabsList>

            <TabsContent value="studio" className="space-y-4 mt-0">
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-1">Drag-and-Drop Canvas</h3>
                <p className="text-xs text-muted-foreground mb-4">Reorder blocks just like a design board to control your editor flow.</p>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCanvasDragEnd}>
                  <SortableContext items={canvasBlocks} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {canvasBlocks.map((blockId) => (
                        <SortableShell
                          key={blockId}
                          id={blockId}
                          className="rounded-xl border border-border bg-secondary/30 p-3"
                        >
                          {({ attributes, listeners }) => (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button type="button" aria-label="Drag block" className="p-2 rounded-md bg-background border border-border cursor-grab active:cursor-grabbing touch-none" {...attributes} {...listeners}>
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <p className="text-sm font-medium text-foreground">{canvasMeta[blockId]?.title || blockId}</p>
                              </div>
                              <p className="text-xs text-muted-foreground">{canvasMeta[blockId]?.subtitle || ""}</p>
                            </div>
                          )}
                        </SortableShell>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </TabsContent>

            <TabsContent value="profile" className="space-y-4 mt-0">
              {/* Avatar section */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-muted-foreground" /> Profile Photo
                </h3>
                <div className="flex items-center gap-4">
                  <div
                    className="rounded-full bg-accent text-accent-foreground flex items-center justify-center font-heading font-bold overflow-hidden border border-border"
                    style={{ width: `${profile.photoSize}px`, height: `${profile.photoSize}px`, transform: `translateY(${profile.photoOffsetY}px)` }}
                  >
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      profile.name?.charAt(0) || "U"
                    )}
                  </div>
                  <div>
                    <Button variant="outline" size="sm" onClick={() => photoInputRef.current?.click()}>Upload Photo</Button>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={applyAvatarFile} />
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG. Max 2MB.</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  <div>
                    <Label className="text-xs">Photo Size ({profile.photoSize}px)</Label>
                    <input type="range" min={48} max={120} value={profile.photoSize} onChange={(event) => update("photoSize", Number(event.target.value))} className="mt-2 w-full" />
                  </div>
                  <div>
                    <Label className="text-xs">Photo Offset ({profile.photoOffsetY}px)</Label>
                    <input type="range" min={-24} max={48} value={profile.photoOffsetY} onChange={(event) => update("photoOffsetY", Number(event.target.value))} className="mt-2 w-full" />
                  </div>
                </div>
              </div>

              {/* Basic info */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" /> Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Full Name</Label>
                    <Input value={profile.name} onChange={e => update("name", e.target.value)} className="mt-1 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Job Title</Label>
                    <Input value={profile.title} onChange={e => update("title", e.target.value)} className="mt-1 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Company</Label>
                    <Input value={profile.company} onChange={e => update("company", e.target.value)} className="mt-1 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Location</Label>
                    <Input value={profile.location} onChange={e => update("location", e.target.value)} className="mt-1 text-sm" placeholder="City, Country" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Bio</Label>
                  <Textarea value={profile.bio} onChange={e => update("bio", e.target.value)} className="mt-1 text-sm" rows={3} placeholder="Tell people about yourself..." />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{profile.bio.length}/200</p>
                </div>
              </div>

              {/* Contact info */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" /> Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email</Label>
                    <Input type="email" value={profile.email} onChange={e => update("email", e.target.value)} className="mt-1 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1.5"><Phone className="w-3 h-3" /> Phone</Label>
                    <Input value={profile.phone} onChange={e => update("phone", e.target.value)} className="mt-1 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs flex items-center gap-1.5"><MessageCircle className="w-3 h-3" /> WhatsApp</Label>
                    <Input value={profile.whatsapp} onChange={e => update("whatsapp", e.target.value)} className="mt-1 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1.5"><Globe className="w-3 h-3" /> Website</Label>
                    <Input value={profile.website} onChange={e => update("website", e.target.value)} className="mt-1 text-sm" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="links" className="space-y-4 mt-0">
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Contact Actions (Drag to Reorder)</h3>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleContactDragEnd}>
                  <SortableContext items={contactActionOrder} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {contactActionOrder.map((actionId) => (
                        <SortableShell
                          key={actionId}
                          id={actionId}
                          className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2"
                        >
                          {({ attributes, listeners }) => (
                            <>
                              <div className="flex items-center gap-2">
                                <button type="button" aria-label="Drag contact action" className="p-2 rounded-md bg-background border border-border cursor-grab active:cursor-grabbing touch-none" {...attributes} {...listeners}>
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <span className="text-sm font-medium capitalize">{actionId}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleContactAction(actionId)}
                                className={`text-xs px-2 py-1 rounded ${enabledContactActions[actionId] === false ? "bg-secondary text-muted-foreground" : "bg-accent/15 text-accent"}`}
                              >
                                {enabledContactActions[actionId] === false ? "Hidden" : "Visible"}
                              </button>
                            </>
                          )}
                        </SortableShell>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-semibold text-sm text-foreground">Social Links</h3>
                  <Button onClick={addLink} variant="outline" size="sm" className="text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Add Link
                  </Button>
                </div>
                {links.length === 0 ? (
                  <div className="border border-dashed border-border rounded-lg p-6 text-center">
                    <Link2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No links added yet</p>
                    <Button onClick={addLink} variant="outline" size="sm" className="mt-3 text-xs">
                      <Plus className="w-3 h-3 mr-1" /> Add your first link
                    </Button>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLinkDragEnd}>
                    <SortableContext items={links.map((link) => `link:${link.id}`)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {links.map((link) => {
                          const IconComponent = platformIcons[link.platform] || Globe;
                          return (
                            <SortableShell
                              key={link.id}
                              id={`link:${link.id}`}
                              className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg group"
                            >
                              {({ attributes, listeners }) => (
                                <>
                                  <button type="button" aria-label="Drag social link" className="p-2 rounded-md bg-background border border-border cursor-grab active:cursor-grabbing touch-none shrink-0" {...attributes} {...listeners}>
                                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                                  </button>
                                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0">
                                    <IconComponent className="w-3.5 h-3.5 text-foreground" />
                                  </div>
                                  <Input value={link.platform} onChange={e => updateLink(link.id, "platform", e.target.value)}
                                    className="text-sm h-8 max-w-[100px]" placeholder="Platform" />
                                  <Input value={link.url} onChange={e => updateLink(link.id, "url", e.target.value)}
                                    className="text-sm h-8 flex-1" placeholder="https://..." />
                                  <button onClick={() => removeLink(link.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </SortableShell>
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </TabsContent>

            <TabsContent value="design" className="space-y-4 mt-0">
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                  <WandSparkles className="w-4 h-4 text-muted-foreground" /> Templates
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {templates.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => applyTemplate(template)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        profile.coverColor === template.coverColor && profile.buttonStyle === template.buttonStyle
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/40"
                      }`}
                    >
                      <div className="h-12 rounded-lg mb-2" style={{ background: template.coverColor }} />
                      <p className="text-sm font-medium text-foreground">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.fontStyle} / {template.buttonStyle.replace("rounded-", "")}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover color */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Background</h3>
                <div className="flex gap-3 flex-wrap">
                  {backgroundStyles.map((item) => (
                    <button key={item.name} onClick={() => update("coverColor", item.value)}
                      className={`w-10 h-10 rounded-xl border-2 transition-all ${
                        profile.coverColor === item.value ? 'border-accent scale-110 shadow-md' : 'border-transparent hover:scale-105'
                      }`}
                      title={item.name}
                      style={{ background: item.value }} />
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-1 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" /> Background Image
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Image URL</Label>
                    <Input
                      value={profile.backgroundImageUrl}
                      onChange={(event) => update("backgroundImageUrl", event.target.value)}
                      className="mt-1 text-sm"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Upload Image</Label>
                    <Input type="file" accept="image/*" onChange={applyBackgroundImageFile} className="mt-1 text-sm" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Overlay Opacity ({profile.backgroundOverlayOpacity}%)</Label>
                    <input
                      type="range"
                      min={0}
                      max={80}
                      value={profile.backgroundOverlayOpacity}
                      onChange={(event) => update("backgroundOverlayOpacity", Number(event.target.value))}
                      className="mt-2 w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Blur Strength ({profile.backgroundBlurStrength}px)</Label>
                    <input
                      type="range"
                      min={0}
                      max={24}
                      value={profile.backgroundBlurStrength}
                      onChange={(event) => update("backgroundBlurStrength", Number(event.target.value))}
                      className="mt-2 w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-1">Body & Text Styling</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Body Background Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={profile.bodyBackgroundColor} onChange={(event) => update("bodyBackgroundColor", event.target.value)} className="h-10 w-14 rounded border border-input" />
                      <Input value={profile.bodyBackgroundColor} onChange={(event) => update("bodyBackgroundColor", event.target.value)} className="text-sm" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Body Text Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={profile.bodyTextColor} onChange={(event) => update("bodyTextColor", event.target.value)} className="h-10 w-14 rounded border border-input" />
                      <Input value={profile.bodyTextColor} onChange={(event) => update("bodyTextColor", event.target.value)} className="text-sm" />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Body Background Image URL</Label>
                    <Input value={profile.bodyBackgroundImageUrl} onChange={(event) => update("bodyBackgroundImageUrl", event.target.value)} className="mt-1 text-sm" placeholder="https://images.unsplash.com/..." />
                  </div>
                  <div>
                    <Label className="text-xs">Action Hover Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={profile.actionHoverColor} onChange={(event) => update("actionHoverColor", event.target.value)} className="h-10 w-14 rounded border border-input" />
                      <Input value={profile.actionHoverColor} onChange={(event) => update("actionHoverColor", event.target.value)} className="text-sm" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <p className="text-sm font-medium">Show Exchange Contact button</p>
                  <button type="button" onClick={() => update("showExchangeContact", !profile.showExchangeContact)} className={`text-xs px-2 py-1 rounded ${profile.showExchangeContact ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}>
                    {profile.showExchangeContact ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>

              {/* Button style */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Button Style</h3>
                <div className="grid grid-cols-3 gap-3">
                  {["Rounded", "Pill", "Square"].map((style) => (
                    <button
                      key={style}
                      onClick={() => update("buttonStyle", style === "Rounded" ? "rounded-lg" : style === "Pill" ? "rounded-full" : "rounded-none")}
                      className={`p-3 border rounded-lg text-center transition-colors text-sm ${
                        (style === "Rounded" && profile.buttonStyle === "rounded-lg") ||
                        (style === "Pill" && profile.buttonStyle === "rounded-full") ||
                        (style === "Square" && profile.buttonStyle === "rounded-none")
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent"
                      }`}
                    >
                      <div className={`w-full h-8 bg-accent mb-2 ${
                        style === "Rounded" ? "rounded-lg" : style === "Pill" ? "rounded-full" : "rounded-none"
                      }`} />
                      <span className="text-xs text-muted-foreground">{style}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Font Style</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "Modern", font: "font-heading" },
                    { name: "Classic", font: "font-body" },
                  ].map((f) => (
                    <button
                      key={f.name}
                      onClick={() => update("fontStyle", f.name)}
                      className={`p-4 border rounded-lg transition-colors text-center ${
                        profile.fontStyle === f.name ? "border-accent bg-accent/5" : "border-border hover:border-accent"
                      }`}
                    >
                      <p className={`text-lg ${f.font} font-bold text-foreground`}>Aa</p>
                      <span className="text-xs text-muted-foreground mt-1">{f.name}</span>
                    </button>
                  ))}
                </div>

                <div className="grid sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <Label className="text-xs">Name Size ({profile.nameSize}px)</Label>
                    <input type="range" min={14} max={30} value={profile.nameSize} onChange={(event) => update("nameSize", Number(event.target.value))} className="mt-2 w-full" />
                  </div>
                  <div>
                    <Label className="text-xs">Title Size ({profile.titleSize}px)</Label>
                    <input type="range" min={10} max={22} value={profile.titleSize} onChange={(event) => update("titleSize", Number(event.target.value))} className="mt-2 w-full" />
                  </div>
                  <div>
                    <Label className="text-xs">Bio Size ({profile.bioSize}px)</Label>
                    <input type="range" min={10} max={20} value={profile.bioSize} onChange={(event) => update("bioSize", Number(event.target.value))} className="mt-2 w-full" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 pt-1">
                  <button type="button" onClick={() => update("nameBold", !profile.nameBold)} className={`rounded-md border px-3 py-2 text-xs ${profile.nameBold ? "border-accent text-accent" : "border-border text-muted-foreground"}`}>
                    Name Bold: {profile.nameBold ? "On" : "Off"}
                  </button>
                  <button type="button" onClick={() => update("titleBold", !profile.titleBold)} className={`rounded-md border px-3 py-2 text-xs ${profile.titleBold ? "border-accent text-accent" : "border-border text-muted-foreground"}`}>
                    Title Bold: {profile.titleBold ? "On" : "Off"}
                  </button>
                  <button type="button" onClick={() => update("bioBold", !profile.bioBold)} className={`rounded-md border px-3 py-2 text-xs ${profile.bioBold ? "border-accent text-accent" : "border-border text-muted-foreground"}`}>
                    Bio Bold: {profile.bioBold ? "On" : "Off"}
                  </button>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Drag to Arrange Sections</h3>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 mb-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Layout Mode</p>
                    <p className="text-xs text-muted-foreground">Stacked order or freeform drag anywhere on the card</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => update("layoutMode", "stack")}
                      className={`text-xs px-2 py-1 rounded ${profile.layoutMode === "stack" ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}
                    >
                      Stack
                    </button>
                    <button
                      type="button"
                      onClick={() => update("layoutMode", "freeform")}
                      className={`text-xs px-2 py-1 rounded ${profile.layoutMode === "freeform" ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}
                    >
                      Freeform
                    </button>
                    <button
                      type="button"
                      onClick={() => commitState((current) => ({
                        ...current,
                        profile: {
                          ...current.profile,
                          sectionPositions: {
                            identity: { x: 0, y: 0 },
                            contact: { x: 0, y: 100 },
                            social: { x: 0, y: 154 },
                          },
                        },
                      }))}
                      className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                  <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {sectionOrder.map((sectionId) => (
                        <SortableShell
                          key={sectionId}
                          id={sectionId}
                          className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2"
                        >
                          {({ attributes, listeners }) => (
                            <>
                              <div className="flex items-center gap-2">
                                <button type="button" aria-label="Drag section" className="p-2 rounded-md bg-background border border-border cursor-grab active:cursor-grabbing touch-none" {...attributes} {...listeners}>
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <p className="text-sm font-medium text-foreground">{sectionMeta[sectionId].label}</p>
                              </div>
                              <p className="text-xs text-muted-foreground">{sectionMeta[sectionId].detail}</p>
                            </>
                          )}
                        </SortableShell>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Live phone preview */}
        <div className="hidden lg:flex flex-col items-center justify-center w-[320px] shrink-0">
          <p className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">Live Preview</p>
          <PhoneMockup>
            <MiniProfileCard
              key={`mini-profile-${previewRevision}`}
              profile={profile}
              sectionOrder={sectionOrder}
              buttonStyle={profile.buttonStyle}
              fontStyle={profile.fontStyle}
              nameSize={profile.nameSize}
              titleSize={profile.titleSize}
              bioSize={profile.bioSize}
              nameBold={profile.nameBold}
              titleBold={profile.titleBold}
              bioBold={profile.bioBold}
              photoSize={profile.photoSize}
              photoOffsetY={profile.photoOffsetY}
              showExchangeContact={profile.showExchangeContact}
              contactActionOrder={contactActionOrder}
              enabledContactActions={enabledContactActions}
              links={links}
              layoutMode={profile.layoutMode}
              sectionPositions={profile.sectionPositions}
              editableLayout={profile.layoutMode === "freeform"}
              onSectionPositionChange={updateSectionPosition}
            />
          </PhoneMockup>
        </div>
      </div>
    </motion.div>
  );
};

export default EditProfile;
