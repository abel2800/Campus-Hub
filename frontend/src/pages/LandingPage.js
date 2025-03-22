// Add a section about teacher features
<section className="py-16 bg-gray-50">
  <div className="container mx-auto px-4">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold mb-4">For Students and Teachers</h2>
      <p className="text-gray-600 max-w-2xl mx-auto">
        CampusHub provides specialized interfaces for both students and teachers, creating a complete educational ecosystem.
      </p>
    </div>
    
    <div className="flex flex-wrap -mx-4">
      <div className="w-full md:w-1/2 px-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md h-full">
          <h3 className="text-xl font-bold mb-4">For Students</h3>
          <ul className="space-y-2 text-gray-600">
            <li>• Access course materials and watch videos</li>
            <li>• Interact with classmates and teachers</li>
            <li>• Track your progress and academic achievements</li>
            <li>• Participate in discussions and forums</li>
            <li>• Receive notifications about assignments and deadlines</li>
          </ul>
          <div className="mt-6">
            <Link to="/register" className="text-primary font-medium">Sign up as a student →</Link>
          </div>
        </div>
      </div>
      
      <div className="w-full md:w-1/2 px-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md h-full">
          <h3 className="text-xl font-bold mb-4">For Teachers</h3>
          <ul className="space-y-2 text-gray-600">
            <li>• Create and manage courses with rich content</li>
            <li>• Upload videos and educational materials</li>
            <li>• Track student progress and engagement</li>
            <li>• Communicate directly with students</li>
            <li>• Access analytics and performance insights</li>
          </ul>
          <div className="mt-6">
            <Link to="/teacher-registration" className="text-primary font-medium">Sign up as a teacher →</Link>
          </div>
        </div>
      </div>
    </div>
  </div>
</section> 