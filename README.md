# Image Management System

A comprehensive web-based solution for managing, organizing, and streamlining image assets through a structured workflow process.

## Features

### Asset Management
- **Image Upload**: Drag-and-drop or click-to-upload functionality
- **File Organization**: Categorize images into Nature, Work, and Personal categories
- **Search & Filter**: Quick search functionality with category filtering
- **Metadata Management**: 
  - UUID tracking
  - Upload date
  - File size
  - Category assignment
  - Tags
  - Descriptions

### Production Workflow
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

## Technical Details

### Built With
- HTML5
- JavaScript
- TailwindCSS for styling
- Font Awesome for icons

### Key Components
- `index.html`: Main asset management interface
- `image-workflow.html`: Workflow management interface
- `script.js`: Core functionality for asset management
- `workflow.js`: Workflow-specific functionality

## Getting Started

1. Clone the repository
2. Open `index.html` in a modern web browser
3. Select your role (Editor/Creator/Approver) to access specific functionality
4. Begin managing your image assets through the intuitive interface

## Features Highlights

- **Modern UI**: Clean, responsive interface with intuitive controls
- **Drag & Drop**: Easy file upload functionality
- **Advanced Filtering**: Search and categorize images efficiently
- **Bulk Operations**: Support for bulk imports and actions
- **Preview Functionality**: Quick image preview with metadata
- **Role-Based Access**: Separate interfaces for different user roles
- **Workflow Management**: Structured process from request to approval

## Best Practices

- Use descriptive filenames for better organization
- Add relevant tags for improved searchability
- Maintain consistent categorization
- Review image details before approval
- Utilize bulk import for multiple similar requests

## Notes

- Supports common image formats
- Includes built-in validation for file types
- Maintains audit trail through UUID tracking
- Responsive design for various screen sizes 