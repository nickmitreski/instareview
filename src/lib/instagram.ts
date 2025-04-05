import axios from 'axios';

export interface InstagramPost {
  likes: number;
  comments: number;
  timestamp: string;
  caption: string;
  url: string;
  imageUrl: string;
  analysis?: string;
  engagement: number;
  dayOfWeek: string;
  timeOfDay: string;
}

export interface InstagramAnalysis {
  posts: InstagramPost[];
  averageEngagement: number;
  bestPerformingDay: string;
  bestPerformingTime: string;
  hashtagAnalysis: { [key: string]: number };
  captionLengthAnalysis: {
    average: number;
    bestLength: number;
  };
  recommendations: string[];
}

export async function getInstagramProfile(username: string): Promise<InstagramAnalysis> {
  console.log(`Getting Instagram profile for: ${username}`);
  
  try {
    // Use Instagram's public API endpoint
    const response = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'X-IG-App-ID': '936619743392459', // Instagram's web app ID
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    // Process the response
    const userData = response.data.data.user;
    
    if (!userData) {
      throw new Error('Profile not found');
    }
    
    if (userData.is_private) {
      throw new Error('This Instagram profile is private');
    }
    
    // Extract all posts with engagement metrics
    const allPosts = userData.edge_owner_to_timeline_media.edges.map((edge: any) => {
      const node = edge.node;
      const timestamp = new Date(node.taken_at_timestamp * 1000);
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][timestamp.getDay()];
      const hour = timestamp.getHours();
      const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
      
      // Calculate engagement (likes + comments)
      const engagement = node.edge_liked_by.count + node.edge_media_to_comment.count;
      
      return {
        likes: node.edge_liked_by.count,
        comments: node.edge_media_to_comment.count,
        timestamp: timestamp.toISOString(),
        caption: node.edge_media_to_caption.edges[0]?.node.text || '',
        url: `https://www.instagram.com/p/${node.shortcode}/`,
        imageUrl: node.display_url || node.thumbnail_src || '',
        engagement,
        dayOfWeek,
        timeOfDay
      };
    });
    
    if (allPosts.length === 0) {
      throw new Error('No posts found on this profile');
    }
    
    // Sort posts by engagement (highest first)
    const sortedPosts = [...allPosts].sort((a, b) => b.engagement - a.engagement);
    
    // Get top 5 posts
    const topPosts = sortedPosts.slice(0, 5);
    
    // Calculate average engagement
    const averageEngagement = allPosts.reduce((sum: number, post: InstagramPost) => sum + post.engagement, 0) / allPosts.length;
    
    // Analyze best performing day
    const dayPerformance: { [key: string]: number } = {};
    allPosts.forEach((post: InstagramPost) => {
      if (!dayPerformance[post.dayOfWeek]) {
        dayPerformance[post.dayOfWeek] = 0;
      }
      dayPerformance[post.dayOfWeek] += post.engagement;
    });
    
    const bestPerformingDay = Object.entries(dayPerformance)
      .sort((a, b) => b[1] - a[1])[0][0];
    
    // Analyze best performing time of day
    const timePerformance: { [key: string]: number } = {};
    allPosts.forEach((post: InstagramPost) => {
      if (!timePerformance[post.timeOfDay]) {
        timePerformance[post.timeOfDay] = 0;
      }
      timePerformance[post.timeOfDay] += post.engagement;
    });
    
    const bestPerformingTime = Object.entries(timePerformance)
      .sort((a, b) => b[1] - a[1])[0][0];
    
    // Analyze hashtags
    const hashtagAnalysis: { [key: string]: number } = {};
    allPosts.forEach((post: InstagramPost) => {
      const hashtags = post.caption.match(/#[\w\u0590-\u05ff]+/g) || [];
      hashtags.forEach((hashtag: string) => {
        if (!hashtagAnalysis[hashtag]) {
          hashtagAnalysis[hashtag] = 0;
        }
        hashtagAnalysis[hashtag] += post.engagement;
      });
    });
    
    // Analyze caption length
    const captionLengths = allPosts.map((post: InstagramPost) => post.caption.length);
    const averageCaptionLength = captionLengths.reduce((sum: number, length: number) => sum + length, 0) / captionLengths.length;
    
    // Find the caption length that performs best
    const captionLengthPerformance: { [key: string]: number } = {};
    allPosts.forEach((post: InstagramPost) => {
      const lengthRange = Math.floor(post.caption.length / 50) * 50;
      const rangeKey = `${lengthRange}-${lengthRange + 49}`;
      if (!captionLengthPerformance[rangeKey]) {
        captionLengthPerformance[rangeKey] = 0;
      }
      captionLengthPerformance[rangeKey] += post.engagement;
    });
    
    const bestCaptionLengthRange = Object.entries(captionLengthPerformance)
      .sort((a, b) => b[1] - a[1])[0][0];
    const bestCaptionLength = parseInt(bestCaptionLengthRange.split('-')[0]) + 25;
    
    // Generate recommendations
    const recommendations = [
      `Post on ${bestPerformingDay}s during ${bestPerformingTime.toLowerCase()} for maximum engagement.`,
      `Your best performing posts have captions around ${bestCaptionLength} characters long.`,
      `Consider using more hashtags in your posts, as they help increase visibility.`
    ];
    
    // Add hashtag recommendations if we have data
    if (Object.keys(hashtagAnalysis).length > 0) {
      const topHashtags = Object.entries(hashtagAnalysis)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);
      
      recommendations.push(`Your top performing hashtags are: ${topHashtags.join(', ')}. Consider using these more frequently.`);
    }
    
    return {
      posts: topPosts,
      averageEngagement,
      bestPerformingDay,
      bestPerformingTime,
      hashtagAnalysis,
      captionLengthAnalysis: {
        average: averageCaptionLength,
        bestLength: bestCaptionLength
      },
      recommendations
    };
  } catch (error) {
    console.error('Error fetching Instagram data:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error('Profile not found');
      } else if (error.response?.status === 403) {
        throw new Error('This Instagram profile is private');
      } else if (error.response?.status === 401) {
        throw new Error('Instagram requires login to view this profile');
      }
    }
    
    throw error;
  }
} 