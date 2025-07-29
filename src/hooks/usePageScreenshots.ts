import { CanvasPage } from '@/pages/Index';

// Get screenshot image for a page - uses GitHub hosted images
export const usePageScreenshots = () => {
  
  // Get GitHub screenshot image for a page
  const getPageScreenshot = (page: CanvasPage): string => {
    // Use specific images from GitHub repository based on page title
    const githubBaseUrl = 'https://raw.githubusercontent.com/FloridaGames/canvas-page-magician/main/src/screenshots';
    
    // Map page titles to existing GitHub screenshots
    const pageImageMap: { [key: string]: string } = {
      'Advanced HTML page': 'Advanced_HTML_page.png',
      'Communicatie': 'Communicatie.png',
      'Demo - Relevante academische literatuur vinden 5': 'Demo_-_Relevante_academische_literatuur_vinden_5.png',
      'Home Copy': 'Home_Copy.png',
      'Kennis en inzicht toepassen': 'Kennis_en_inzicht_toepassen.png',
      'Oordelen vellen': 'Oordelen_vellen.png',
      'Overkoepelende vaardigheden': 'Overkoepelende_vaardigheden.png'
    };
    
    // Check if we have a specific image for this page title
    const specificImage = pageImageMap[page.title];
    if (specificImage) {
      return `${githubBaseUrl}/${specificImage}`;
    }
    
    // Default to the Default_Page.png for any other pages
    return `${githubBaseUrl}/Default_Page.png`;
  };

  return {
    getPageScreenshot
  };
};