import {
  Building2,
  GraduationCap,
  MapPin,
  Pencil,
  Plus,
  Share2,
} from "lucide-react";
import React, { useState } from "react";

const index = () => {
  const [user] = useState({
    name: "John Doe",
    title: "Software Engineer",
    location: "San Francisco, CA",
    email: "john.doe@example.com",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    bio: "Passionate software engineer with 5+ years of experience in full-stack development. Currently focusing on AI and machine learning.",
    company: "Tech Corp",
    education: "M.S. Computer Science, Stanford University",
    skills: [
      "JavaScript",
      "Python",
      "React",
      "Node.js",
      "Machine Learning",
      "AWS",
    ],
  });

  const workExperience = [
    {
      title: "Senior Software Engineer",
      company: "Tech Corp",
      period: "2021 - Present",
      description:
        "Leading the development of AI-powered features for our main product.",
    },
    {
      title: "Software Engineer",
      company: "StartupCo",
      period: "2019 - 2021",
      description: "Developed and maintained multiple full-stack applications.",
    },
  ];

  const education = [
    {
      degree: "M.S. Computer Science",
      school: "Stanford University",
      period: "2017 - 2019",
    },
    {
      degree: "B.S. Computer Science",
      school: "UC Berkeley",
      period: "2013 - 2017",
    },
  ];

  const projects = [
    {
      name: "AI Image Recognition",
      description:
        "Developed a machine learning model for image recognition with 95% accuracy.",
      technologies: ["Python", "TensorFlow", "AWS"],
    },
    {
      name: "E-commerce Platform",
      description: "Built a full-stack e-commerce platform serving 10k+ users.",
      technologies: ["React", "Node.js", "MongoDB"],
    },
  ];
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row">
              <img
                src={user.image}
                alt=""
                className="h-24 w-24 rounded-full object-cover"
              />
              <div>
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-gray-600">{user.title}</p>
                <div className="mt-2 flex items-center gap-2 text-gray-500">
                  <MapPin className="h-4 w-4" />
                  <span>{user.location}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="flex items-center justify-center gap-2 rounded-md border px-4 py-2 hover:bg-gray-50">
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
              <button className="flex items-center justify-center gap-2 rounded-md border px-4 py-2 hover:bg-gray-50">
                <Pencil className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
          <p className="text-gray-600">{user.bio}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-400" />
              <span>{user.company}</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-gray-400" />
              <span>{user.education}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {user.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
            <button className="px-3 py-1 border rounded-full text-sm flex items-center space-x-1">
              <Plus className="h-4 w-4" />
              <span>Add Skill</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">Work Experience</h2>
            <button className="flex items-center gap-1 text-blue-600">
              <Plus className="h-4 w-4" />
              <span>Add Experience</span>
            </button>
          </div>
          <div className="space-y-6">
            {workExperience.map((exp, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <Building2 className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold">{exp.title}</h3>
                  <p className="text-gray-600">{exp.company}</p>
                  <p className="text-sm text-gray-500">{exp.period}</p>
                  <p className="mt-2">{exp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">Education</h2>
            <button className="flex items-center gap-1 text-blue-600">
              <Plus className="h-4 w-4" />
              <span>Add Education</span>
            </button>
          </div>
          <div className="space-y-6">
            {education.map((edu, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <GraduationCap className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold">{edu.degree}</h3>
                  <p className="text-gray-600">{edu.school}</p>
                  <p className="text-sm text-gray-500">{edu.period}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">Project</h2>
            <button className="flex items-center gap-1 text-blue-600">
              <Plus className="h-4 w-4" />
              <span>Add Project</span>
            </button>
          </div>
          <div className="space-y-6">
            {projects.map((project, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-semibold">{project.name}</h3>
                <p className="text-gray-600 mt-2">{project.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {project.technologies.map((tech, techIndex) => (
                    <span
                      className="px-2 py-1 bg-gray-100 rounded-md text-sm"
                      key={techIndex}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default index;
