import { Mail, Phone, MapPin, ExternalLink, Instagram } from "lucide-react";

interface ProfilePreviewProps {
  firstName: string;
  lastName: string;
  formData: {
    photo_url: string;
    title: string;
    bio: string;
    phone: string;
    email_public: string;
    location: string;
    website: string;
    linkedin_url: string;
    twitter_url: string;
    instagram_url: string;
    whatsapp: string;
    cover_color?: string;
    bg_image_url?: string;
  };
}

const ProfilePreview = ({ firstName = "", lastName = "", formData }: ProfilePreviewProps) => {
  const fullName = `${firstName} ${lastName}`.trim();
  const coverColor = formData.cover_color || "#10b981";

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      {/* Header Background */}
      <div 
        className="h-24 bg-cover bg-center"
        style={{
          backgroundColor: coverColor,
          backgroundImage: formData.bg_image_url ? `url(${formData.bg_image_url})` : undefined,
          backgroundBlendMode: formData.bg_image_url ? "overlay" : undefined,
        }}
      />

      {/* Profile Content */}
      <div className="px-6 pb-6">
        {/* Photo */}
        <div className="flex justify-center -mt-16 mb-6">
          {formData.photo_url ? (
            <img
              src={formData.photo_url}
              alt={fullName}
              className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 border-4 border-white shadow-lg flex items-center justify-center">
              <span className="text-3xl font-bold text-slate-400">
                {firstName.charAt(0)}{lastName.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Name */}
        <h2 className="text-2xl font-bold text-slate-900 text-center">{fullName}</h2>

        {/* Title */}
        {formData.title && (
          <p className="text-sm text-emerald-600 font-semibold text-center mt-1">
            {formData.title}
          </p>
        )}

        {/* Location */}
        {formData.location && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 mt-2">
            <MapPin className="w-4 h-4" />
            {formData.location}
          </div>
        )}

        {/* Bio */}
        {formData.bio && (
          <p className="text-sm text-slate-600 text-center mt-4 line-clamp-3">
            {formData.bio}
          </p>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 mt-6">
          {formData.email_public && (
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-900 text-sm font-medium">
              <Mail className="w-4 h-4" />
              Email
            </button>
          )}
          {formData.phone && (
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-900 text-sm font-medium">
              <Phone className="w-4 h-4" />
              Call
            </button>
          )}
          {formData.website && (
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 transition-colors text-white text-sm font-medium">
              <ExternalLink className="w-4 h-4" />
              Website
            </button>
          )}
        </div>

        {/* Socials */}
        {(formData.linkedin_url || formData.twitter_url || formData.instagram_url) && (
          <div className="flex justify-center gap-3 mt-6 pt-6 border-t border-slate-200">
            {formData.linkedin_url && (
              <a
                href={formData.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-blue-500 transition-colors flex items-center justify-center text-slate-900 hover:text-white text-sm font-bold"
              >
                in
              </a>
            )}
            {formData.twitter_url && (
              <a
                href={formData.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-blue-400 transition-colors flex items-center justify-center text-slate-900 hover:text-white text-xs font-bold"
              >
                𝕏
              </a>
            )}
            {formData.instagram_url && (
              <a
                href={formData.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white hover:shadow-lg transition-shadow"
              >
                <Instagram className="w-5 h-5" />
              </a>
            )}
          </div>
        )}

        {/* Empty State */}
        {!formData.photo_url && !formData.title && !formData.bio && (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">Start filling in your details to see a preview</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePreview;
