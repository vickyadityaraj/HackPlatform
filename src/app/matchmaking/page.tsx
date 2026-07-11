import { getPublicProfiles } from "@/actions/profile";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Github, Linkedin, Briefcase, Globe, GraduationCap, ArrowRight, UserPlus } from "lucide-react";
import Link from "next/link";

interface SearchParams {
  search?: string;
  skills?: string;
  experience?: string;
  country?: string;
  sortBy?: "newest" | "experience";
  page?: string;
}

export default async function MatchmakingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const search = resolvedParams.search || "";
  const experience = resolvedParams.experience || "";
  const country = resolvedParams.country || "";
  const sortBy = resolvedParams.sortBy || "newest";
  const page = parseInt(resolvedParams.page || "1", 10);
  const skillsList = resolvedParams.skills ? resolvedParams.skills.split(",").map(s => s.trim()).filter(Boolean) : [];

  const { profiles, totalPages, currentPage } = await getPublicProfiles({
    search,
    skills: skillsList,
    experience,
    country,
    sortBy,
    page,
    limit: 8,
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans p-6 md:p-12 space-y-8">
      {/* Header Info */}
      <div className="max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-455 bg-clip-text text-transparent">
          Developer Matchmaking Hub
        </h1>
        <p className="text-neutral-400 text-sm md:text-base mt-2">
          Find your dream hackathon team members. Search profiles, filtering by languages, expertise, or universities, and extend invitations to join your workspace.
        </p>
      </div>

      {/* Filter Options Bar */}
      <form method="GET" className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4 shadow-xl">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
          <Input
            name="search"
            defaultValue={search}
            placeholder="Search names, bios, colleges..."
            className="pl-9 bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 placeholder:text-neutral-600 text-xs"
          />
        </div>

        <div>
          <Input
            name="skills"
            defaultValue={resolvedParams.skills || ""}
            placeholder="Skills (comma separated: python, react)"
            className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 placeholder:text-neutral-600 text-xs"
          />
        </div>

        <div>
          <select
            name="experience"
            defaultValue={experience}
            className="w-full h-10 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs px-3 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="">All Experience Levels</option>
            <option value="Beginner (0-1 yrs)">Beginner (0-1 yrs)</option>
            <option value="Intermediate (2-4 yrs)">Intermediate (2-4 yrs)</option>
            <option value="Advanced (5+ yrs)">Advanced (5+ yrs)</option>
          </select>
        </div>

        <div className="flex gap-2">
          <select
            name="sortBy"
            defaultValue={sortBy}
            className="flex-1 h-10 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs px-3 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="newest">Sort by Newest</option>
            <option value="experience">Sort by Experience</option>
          </select>

          <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-neutral-100 font-semibold px-4 text-xs h-10">
            Apply
          </Button>
        </div>
      </form>

      {/* Profiles Grid */}
      {profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-neutral-800 rounded-xl">
          <Briefcase className="w-12 h-12 text-neutral-600 mb-4" />
          <h3 className="text-lg font-bold text-neutral-300">No matching profiles found</h3>
          <p className="text-neutral-500 text-sm mt-1 max-w-sm">
            Try adjusting your search criteria, widening the filter scope, or check spelling variables.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {profiles.map((profile) => (
            <Card key={profile.id} className="bg-neutral-900 border-neutral-800 text-neutral-100 shadow-md hover:border-neutral-700 transition-all duration-300 flex flex-col justify-between overflow-hidden">
              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {/* Name and Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold uppercase text-sm">
                      {profile.user.name ? profile.user.name.substring(0, 2) : "DV"}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-neutral-50 truncate text-sm">{profile.user.name || "Developer"}</h4>
                      <p className="text-[10px] text-neutral-500 truncate">{profile.user.email}</p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed min-h-[54px]">
                    {profile.bio || "No biography provided yet."}
                  </p>

                  {/* Location & College details */}
                  <div className="space-y-1 text-[11px] text-neutral-500 pt-3 border-t border-neutral-850/50">
                    {profile.college && (
                      <div className="flex items-center gap-1.5 truncate">
                        <GraduationCap className="w-3.5 h-3.5 flex-shrink-0 text-neutral-500" />
                        <span className="truncate">{profile.college}</span>
                      </div>
                    )}
                    {profile.experience && (
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 flex-shrink-0 text-neutral-500" />
                        <span>{profile.experience}</span>
                      </div>
                    )}
                    {profile.country && (
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 flex-shrink-0 text-neutral-500" />
                        <span>{profile.country}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills section */}
                <div className="space-y-3 pt-3 border-t border-neutral-850/40">
                  <div className="flex flex-wrap gap-1 max-h-[64px] overflow-hidden">
                    {profile.skills.length === 0 ? (
                      <span className="text-[10px] text-neutral-600">No skill tags configured</span>
                    ) : (
                      profile.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-[9px] h-4.5 px-1.5 bg-neutral-950 border-neutral-800 text-neutral-400 capitalize">
                          {skill}
                        </Badge>
                      ))
                    )}
                  </div>

                  {/* Social and Action Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-2">
                      {profile.githubUrl && (
                        <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-neutral-200">
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                      {profile.linkedInUrl && (
                        <a href={profile.linkedInUrl} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-neutral-200">
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    <Link href={`/dashboard/participant/invite?userId=${profile.user.id}`}>
                      <Button variant="ghost" className="text-violet-400 hover:text-violet-300 hover:bg-neutral-800 text-xs px-2.5 h-8 flex items-center gap-1">
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Invite</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination component */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-6">
          <Link href={`/matchmaking?search=${search}&skills=${resolvedParams.skills || ""}&experience=${experience}&sortBy=${sortBy}&page=${Math.max(currentPage - 1, 1)}`}>
            <Button variant="outline" disabled={currentPage === 1} className="border-neutral-850 bg-neutral-900 text-neutral-300 text-xs h-9">
              Previous
            </Button>
          </Link>
          <span className="text-xs text-neutral-400 font-semibold">
            Page {currentPage} of {totalPages}
          </span>
          <Link href={`/matchmaking?search=${search}&skills=${resolvedParams.skills || ""}&experience=${experience}&sortBy=${sortBy}&page=${Math.min(currentPage + 1, totalPages)}`}>
            <Button variant="outline" disabled={currentPage === totalPages} className="border-neutral-850 bg-neutral-900 text-neutral-300 text-xs h-9">
              Next
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
