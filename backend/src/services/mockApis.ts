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

// Helper to perform Snipe-IT searches and extract the best match ID
const searchSnipeITEntity = async (endpoint: string, query: string, exactMatchField: string): Promise<number | null> => {
  const snipeUrl = process.env.SNIPE_IT_URL || process.env.SNIPEIT_URL;
  const snipeToken = process.env.SNIPE_IT_TOKEN || process.env.SNIPEIT_TOKEN;
  if (!snipeUrl || !snipeToken || !query) return null;

  try {
    const cleanUrl = snipeUrl.trim().replace(/\/$/, '');
    const url = `${cleanUrl}/api/v1/${endpoint}?search=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${snipeToken.trim()}`,
        'Accept': 'application/json',
      }
    });

    if (response.ok) {
      const data: any = await response.json();
      if (data && data.rows && Array.isArray(data.rows)) {
        // Find exact match (case insensitive)
        const match = data.rows.find((item: any) => 
          item[exactMatchField] && item[exactMatchField].toLowerCase() === query.toLowerCase()
        );
        // Fallback to first result if no exact match, else null
        return match ? match.id : (data.rows.length > 0 ? data.rows[0].id : null);
      }
    }
  } catch (err) {
    console.error(`[Snipe-IT Search] Failed to fetch ${endpoint} for query '${query}':`, err);
  }
  return null;
};

export const SnipeITService = {
  createUser: async (user: any) => {
    const snipeUrl = process.env.SNIPE_IT_URL || process.env.SNIPEIT_URL;
    const snipeToken = process.env.SNIPE_IT_TOKEN || process.env.SNIPEIT_TOKEN;

    if (!snipeUrl || !snipeToken) {
      console.warn('[Snipe-IT API] Missing credentials. Using mock fallback.');
      await delay(1000);
      return { success: true, snipeItUserId: 9999, message: 'Mock User created (Missing Credentials)' };
    }

    try {
      console.log(`[Snipe-IT API] Resolving IDs for Company, Department, and Manager...`);
      // 1. Resolve Company ID
      const company_id = await searchSnipeITEntity('companies', user.company, 'name');
      // 2. Resolve Department ID
      const department_id = await searchSnipeITEntity('departments', user.department, 'name');
      // 3. Resolve Manager ID (Account Manager)
      const manager_id = await searchSnipeITEntity('users', user.accountManager, 'name');

      // Generate a secure 16 character random password
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(8).toString('hex');

      const payload = {
        first_name: user.firstName,
        last_name: user.lastName || '',
        username: user.username,
        password: randomPassword,
        password_confirmation: randomPassword,
        email: user.companyEmailId,
        employee_num: user.employeeId,
        jobtitle: user.designation,
        phone: user.contactNumber,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
        zip: user.zip,
        company_id: company_id || undefined,
        department_id: department_id || undefined,
        manager_id: manager_id || undefined,
        notes: `Auto-generated by SBQ Portal. Original Values -> Company: ${user.company} | Dept: ${user.department} | Mgr: ${user.accountManager}`
      };

      const cleanUrl = snipeUrl.trim().replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${snipeToken.trim()}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data: any = await response.json();
      
      if (response.ok && data.status === 'success') {
        console.log(`[Snipe-IT API] User ${user.username} created successfully with ID ${data.payload.id}`);
        return {
          success: true,
          snipeItUserId: data.payload.id,
          message: 'User created successfully in Snipe-IT'
        };
      } else {
        console.error(`[Snipe-IT API] User creation failed:`, data.messages || data);
        return {
          success: false,
          message: typeof data.messages === 'string' ? data.messages : JSON.stringify(data.messages) || 'Failed to create user'
        };
      }
    } catch (err: any) {
      console.error(`[Snipe-IT API] Connection error during user creation: ${err.message}`);
      return { success: false, message: err.message };
    }
  },
  searchUsers: async (query: string): Promise<any[]> => {
    const snipeUrl = process.env.SNIPE_IT_URL;
    const snipeToken = process.env.SNIPE_IT_TOKEN;

    if (snipeUrl && snipeToken) {
      try {
        const cleanUrl = snipeUrl.trim().replace(/\/$/, '');
        const url = `${cleanUrl}/api/v1/users?search=${encodeURIComponent(query)}`;
        console.log(`[Snipe-IT API] Searching users with query: ${query}`);
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
            return data.rows.map((u: any) => ({
              id: u.id,
              name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
              username: u.username,
              email: u.email
            }));
          }
        }
      } catch (err: any) {
        console.error(`[Snipe-IT API] User search failed: ${err.message}`);
      }
    }
    // Fallback Mock Users for Local Dev
    const mockUsers = [
      { id: 1, name: 'Omkar Bapat', username: 'omkar.bapat', email: 'omkar.bapat@easternenterprise.com' },
      { id: 2, name: 'Kalyani Chourasia', username: 'kalyani.chourasia', email: 'kalyani.chourasia@easternenterprise.com' },
      { id: 3, name: 'Sonal Thorat', username: 'sonal.thorat', email: 'sonal.thorat@easternenterprise.com' },
      { id: 4, name: 'John Doe', username: 'john.doe', email: 'john.doe@easternenterprise.com' },
      { id: 5, name: 'Jane Smith', username: 'jane.smith', email: 'jane.smith@easternenterprise.com' }
    ];
    return mockUsers.filter(u => u.name.toLowerCase().includes(query.toLowerCase()));
  },
  assignAsset: async (snipeItUserId: number, assetTag: string) => {
    await delay(1000);
    return {
      success: true,
      message: `Asset ${assetTag} assigned to user ${snipeItUserId}`,
    };
  }
};
