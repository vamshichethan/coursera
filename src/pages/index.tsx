import React, { useEffect, useState } from "react";
import {
  Code,
  Database,
  BrainCircuit,
  School,
  Trophy,
  Target,
  Server,
  Laptop,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Course, courses } from "@/Components/data/constant";

const courseTags = [
  "Programming",
  "Design",
  "Marketing",
  "Business",
  "Data Science",
  "AI/ML",
];

const index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(courses);

  const certificates = [
    {
      title: "IBM Back-End Development",
      provider: "IBM",
      type: "Professional Certificate",
      image:
        "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "IBM Full Stack Software Developer",
      provider: "IBM",
      type: "Professional Certificate",
      image:
        "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "IBM Developer",
      provider: "IBM",
      type: "Professional Certificate",
      image:
        "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "IBM DevOps and Software Engineering",
      provider: "IBM",
      type: "Professional Certificate",
      image:
        "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80",
    },
  ];

  const genAICourses = [
    {
      title: "IBM Generative AI Engineering",
      provider: "IBM",
      type: "Professional Certificate",
      image:
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Agents: AI and AI Agents for Leaders",
      provider: "DeepLearning.AI",
      type: "Specialization",
      image:
        "https://images.unsplash.com/photo-1676299081847-824916de030a?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Microsoft AI & ML Engineering",
      provider: "Microsoft",
      type: "Professional Certificate",
      image:
        "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&w=800&q=80",
    },
  ];
  const categories = [
    { icon: Code, name: "Computer Science", count: "425+ Courses" },
    { icon: Database, name: "Data Science", count: "320+ Courses" },
    { icon: BrainCircuit, name: "AI & ML", count: "280+ Courses" },
    { icon: School, name: "Business", count: "890+ Courses" },
    { icon: Trophy, name: "Personal Development", count: "215+ Courses" },
    { icon: Target, name: "Marketing", count: "190+ Courses" },
  ];

  const stats = [
    { number: "92M+", label: "Learners" },
    { number: "3,800+", label: "Courses" },
    { number: "275+", label: "Partners" },
    { number: "175+", label: "Countries" },
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((currentTag) => currentTag !== tag)
        : [...currentTags, tag]
    );
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
  };

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    const nextFilteredCourses = courses.filter((course) => {
      const matchesSearch =
        !query ||
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.tags.some((tag) => tag.toLowerCase().includes(query));
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => course.tags.includes(tag));

      return matchesSearch && matchesTags;
    });

    setFilteredCourses(nextFilteredCourses);
  }, [searchQuery, selectedTags]);

  return (
    <div>
      <div className="bg-[#F3F4F5] py-2">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-xs leading-5 sm:text-sm">
            Learn from Adobe experts, gain graphic design skills, and build a
            portfolio that gets you noticed.
            <a href="#" className="text-[#0056D2] ml-1 hover:underline">
              Learn today!
            </a>
            <button className="ml-2 text-gray-500">×</button>
          </p>
        </div>
      </div>

      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-16">
          <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
            <div className="max-w-xl text-center lg:text-left">
              <h1 className="mb-4 text-3xl font-bold text-gray-900 sm:mb-6 sm:text-5xl">
                Learn without limits
              </h1>
              <p className="mb-6 text-base text-gray-600 sm:mb-8 sm:text-xl">
                Start, switch, or advance your career with more than 10,000
                courses, Professional Certificates, and degrees from world-class
                universities and companies.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <button className="px-6 py-3 bg-[#0056D2] text-white font-semibold rounded-sm">
                  Join for Free
                </button>
                <button className="px-6 py-3 border border-[#0056D2] text-[#0056D2] font-semibold rounded-sm">
                  Try Coursera for Business
                </button>
              </div>
            </div>
            <div className="w-full max-w-[500px]">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
                alt="Student"
                className="h-auto w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold">Most Popular Certificates</h2>
            <div className="flex gap-4">
              <button className="px-4 py-2 border text-[#0056D2] font-semibold rounded-sm">
                Show more
              </button>
              <button className="px-4 py-2 text-[#0056D2] font-semibold">
                View all
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {certificates.map((cert, index) => (
              <div
                key={index}
                className="border rounded-sm overflow-hidden hover:shadow-lg transition-shadow"
              >
                <img
                  src={cert.image}
                  alt={cert.title}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <Server className="h-6 w-6 mr-2 text-blue-600" />
                    <span className="text-sm text-gray-600">
                      {cert.provider}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2">{cert.title}</h3>
                  <p className="text-sm text-gray-600">{cert.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#F3F4F5] py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Get started with GenAI
              </h2>
              <p className="text-gray-600">
                Identify, develop, and execute impactful GenAI business
                strategies.
              </p>
            </div>
            <button className="px-4 py-2 text-left font-semibold text-[#0056D2] sm:ml-auto sm:text-center">
              View all GenAI
            </button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {genAICourses.map((course, index) => (
              <div
                key={index}
                className="bg-white rounded-sm overflow-hidden hover:shadow-lg transition-shadow"
              >
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <BrainCircuit className="h-6 w-6 mr-2 text-blue-600" />
                    <span className="text-sm text-gray-600">
                      {course.provider}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-600">{course.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Explore Courses</h2>
              <p className="text-gray-600">
                Search programs by title, description, or career-focused tags.
              </p>
            </div>
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-left font-semibold text-[#0056D2] sm:text-center"
            >
              Clear filters
            </button>
          </div>

          <div className="mb-8 rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search courses by title or description"
                className="w-full rounded-sm border border-gray-300 py-3 pl-10 pr-4 text-gray-900 outline-none transition-colors focus:border-[#0056D2]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {courseTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);

                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? "border-[#0056D2] bg-[#0056D2] text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-[#0056D2] hover:text-[#0056D2]"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredCourses.map((course) => (
              <Link
                key={course.id}
                href={`/course/${course.id}`}
                className="block h-full overflow-hidden rounded-sm border transition-shadow hover:shadow-lg"
              >
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <Laptop className="h-6 w-6 mr-2 text-blue-600" />
                    <span className="text-sm text-gray-600">
                      {course.provider}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-600">{course.type}</p>
                  <p className="mt-2 text-sm leading-5 text-gray-600">
                    {course.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {course.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-[#0056D2]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {filteredCourses.length === 0 && (
            <div className="rounded-sm border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-600">
              No courses found. Try another search or filter.
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Explore Top Categories
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <div
                key={index}
                className="flex items-center p-6 bg-white rounded-lg hover:shadow-md cursor-pointer"
              >
                <category.icon className="h-8 w-8 text-[#0056D2] mr-4" />
                <div>
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  <p className="text-gray-600 text-sm">{category.count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0056D2] text-white py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
              Join the World's Largest Learning Platform
            </h2>
            <p className="text-blue-100">
              Transform your life through education
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mb-2 text-3xl font-bold sm:text-4xl">{stat.number}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default index;
