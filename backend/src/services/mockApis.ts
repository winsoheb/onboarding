/**
 * Mock API integrations for Active Directory, Microsoft Graph API, and Snipe-IT.
 * These functions act as placeholders and simulate network delays.
 */

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data for existing organization emails
const takenEmails = [
  's.shaikh@easternenterprise.com',
  'so.shaikh@easternenterprise.com',
  'j.doe@easternenterprise.com',
];

export const ITInventoryService = {
  checkEmailExists: async (email: string): Promise<boolean> => {
    const snipeUrl = process.env.SNIPE_IT_URL;
    const snipeToken = process.env.SNIPE_IT_TOKEN;

    if (snipeUrl && snipeToken) {
      try {
        const cleanUrl = snipeUrl.trim().replace(/\/$/, '');
        const url = `${cleanUrl}/api/v1/users?search=${encodeURIComponent(email)}`;
        
        console.log(`[Snipe-IT API] Checking email availability: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${snipeToken.trim()}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data: any = await response.json();
          if (data && data.rows && Array.isArray(data.rows)) {
            // Check for exact email match to prevent false positives from fuzzy searching
            const exactMatch = data.rows.some(
              (user: any) => user.email && user.email.toLowerCase() === email.toLowerCase()
            );
            if (exactMatch) {
              console.log(`[Snipe-IT API] Email '${email}' is already taken in Snipe-IT.`);
              return true;
            }
          }
        } else {
          console.warn(`[Snipe-IT API] HTTP error response: ${response.status}`);
        }
      } catch (err: any) {
        console.error(`[Snipe-IT API] Failed to connect to Snipe-IT server: ${err.message}`);
      }
    }

    // Fallback to development mock array
    console.log(`[Snipe-IT API Check] Using local mock fallback for '${email}'`);
    await delay(300); // Simulate network latency
    return takenEmails.includes(email.toLowerCase());
  }
};

export const ActiveDirectoryService = {
  createAccount: async (user: { firstName: string; lastName: string; department: string }) => {
    await delay(1000);
    const username = `${user.firstName.toLowerCase()}.${user.lastName.toLowerCase()}`;
    return {
      success: true,
      username,
      companyEmail: `${username}@easternenterprise.com`,
      message: 'AD Account Created Successfully',
    };
  },
  enableMFA: async (username: string) => {
    await delay(800);
    return {
      success: true,
      message: `MFA enabled for ${username}`,
    };
  }
};

export const MicrosoftGraphService = {
  assignLicense: async (email: string, licenseType: string = 'E3') => {
    await delay(1500);
    return {
      success: true,
      message: `Assigned ${licenseType} license to ${email}`,
    };
  }
};

export const SnipeITService = {
  createUser: async (user: { name: string; email: string }) => {
    await delay(1000);
    return {
      success: true,
      snipeItUserId: Math.floor(Math.random() * 10000),
      message: 'User created in Snipe-IT',
    };
  },
  assignAsset: async (snipeItUserId: number, assetTag: string) => {
    await delay(1000);
    return {
      success: true,
      message: `Asset ${assetTag} assigned to user ${snipeItUserId}`,
    };
  }
};
