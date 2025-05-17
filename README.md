# Asset Management System - Version 2

A comprehensive web-based solution for managing, organizing, and streamlining both image and video assets through structured workflow processes.

## Features

### Image Management
- **Image Upload**: Drag-and-drop or click-to-upload functionality
- **File Organization**: Organize by projects (e.g., 9000 Algebra I, 9000 Algebra II)
- **Search & Filter**: Quick search functionality with project filtering
- **Metadata Management**: 
  - UUID tracking
  - Upload date
  - File size
  - Project assignment
  - Tags
  - Descriptions

### Video Management
- **Video Upload**: Support for various video formats
- **Project Organization**: Categorize videos by educational projects
- **Search & Filter**: Advanced search with project filtering
- **Metadata Management**:
  - UUID tracking
  - Upload date
  - File size (formatted display)
  - Project assignment
  - Duration tracking
  - Descriptions

### Image Production Workflow
The system includes a structured workflow with three distinct roles:

1. **Image Editor**
   - Create image requests
   - Bulk import capabilities
   - Manage multiple requests simultaneously
   - Add descriptions and specifications

2. **Image Creator**
   - View pending image requests
   - Upload images for specific requests
   - Track request status
   - UUID-based tracking system

3. **Image Approver**
   - Review uploaded images
   - Preview functionality
   - Approve or reject submissions
   - Track image status through the workflow

### Video Production Workflow
Similar to image workflow, with additional video-specific features:

1. **Video Editor**
   - Create video requests
   - Specify video requirements
   - Track video revisions
   - Add detailed descriptions

2. **Video Creator**
   - Handle video upload requests
   - Upload videos with metadata
   - Track upload progress
   - Manage video versions

3. **Video Approver**
   - Review uploaded videos
   - Preview video content
   - Approve or reject with feedback
   - Track revision history
   - View previous versions

## Technical Details

### Built With
- HTML5
- JavaScript
- TailwindCSS for styling
- Font Awesome for icons

### Key Components
- `image_management.html`: Image asset management interface
- `video_management.html`: Video asset management interface
- `image-workflow.html`: Image workflow management interface
- `video-workflow.html`: Video workflow management interface
- `script.js`: Core functionality for image management
- `video_script.js`: Core functionality for video management
- `workflow.js`: Image workflow functionality
- `video-workflow.js`: Video workflow functionality
- `table-resize.js`: Table column resize functionality

## Getting Started

1. Clone the repository
2. Open desired interface:
   - `image_management.html` for image management
   - `video_management.html` for video management
   - `image-workflow.html` for image workflow
   - `video-workflow.html` for video workflow
3. Select your role (Editor/Creator/Approver) to access specific functionality
4. Begin managing your assets through the intuitive interface

## Features Highlights

- **Modern UI**: Clean, responsive interface with intuitive controls
- **Unified Navigation**: Seamless switching between image and video sections
- **Advanced Search**: Enhanced search functionality for both images and videos
- **Project-Based Organization**: Structured content organization by educational projects
- **Bulk Operations**: Support for bulk imports and actions
- **Preview Functionality**: Quick preview for both images and videos
- **Role-Based Access**: Separate interfaces for different user roles
- **Workflow Management**: Structured process from request to approval
- **Version Control**: Track revisions and maintain version history
- **UUID Consistency**: Maintain asset identity across systems

## Best Practices

- Use descriptive filenames for better organization
- Add relevant project information for proper categorization
- Maintain consistent metadata across systems
- Review all details before approval
- Utilize bulk import for multiple similar requests
- Provide clear feedback for rejections
- Track revisions systematically

## Notes

- Supports common image and video formats
- Includes built-in validation for file types
- Maintains audit trail through UUID tracking
- Responsive design for various screen sizes
- Preserves metadata across workflow stages
- Handles large file sizes with formatted display 