const http = require('http');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: body ? JSON.parse(body) : null
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  console.log('--- STARTING WORKFLOW VERIFICATION SCRIPT ---');

  // 1. Get all tickets
  const { data: ticketsData } = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/tickets',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer bypass-SUPER_ADMIN'
    }
  });

  const tickets = ticketsData.tickets;
  console.log(`Found ${tickets.length} total tickets.`);

  // Find or create an IT & Asset Prep ticket
  let ticket = tickets.find(t => t.status === 'IT & Asset Preparation');
  if (!ticket) {
    console.log('No ticket in "IT & Asset Preparation" found. Finding an HR Verification ticket to transition...');
    const hrTicket = tickets.find(t => t.status === 'HR Verification');
    if (!hrTicket) {
      console.error('No tickets found to test with.');
      return;
    }
    
    // First verify BGV to transition HR -> IT Prep
    console.log(`Transitioning ticket ${hrTicket.id} to IT & Asset Preparation...`);
    await request({
      host: 'localhost',
      port: 5000,
      path: `/api/modules/${hrTicket.id}/hr`,
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer bypass-SUPER_ADMIN',
        'Content-Type': 'application/json'
      }
    }, {
      bgvStatus: 'Cleared',
      approvalType: 'BGV_CLEARED',
      approved: true
    });

    await request({
      host: 'localhost',
      port: 5000,
      path: `/api/tickets/${hrTicket.id}/status`,
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer bypass-SUPER_ADMIN',
        'Content-Type': 'application/json'
      }
    }, { status: 'IT & Asset Preparation' });

    ticket = hrTicket;
  }

  const ticketId = ticket.id;
  console.log(`Using ticket ID ${ticketId} for testing.`);

  // 2. Fetch inventory licenses counts
  console.log('\n--- 2. Fetching available licenses counts ---');
  const { data: licensesRes } = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/modules/inventory/licenses',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer bypass-IT_ADMIN'
    }
  });
  console.log('Counts:', licensesRes.counts);

  // 3. Try to transition to Dispatch without details
  console.log('\n--- 3. Trying to transition to Dispatch (should fail) ---');
  const failRes = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/tickets/${ticketId}/status`,
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer bypass-SUPER_ADMIN',
      'Content-Type': 'application/json'
    }
  }, { status: 'Dispatch' });
  console.log(`Status: ${failRes.statusCode}, Error:`, failRes.data.error);

  // 4. Update IT & Asset details
  console.log('\n--- 4. Completing IT details and Asset specs (without credentials) ---');
  await request({
    host: 'localhost',
    port: 5000,
    path: `/api/modules/${ticketId}/it`,
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer bypass-IT_ADMIN',
      'Content-Type': 'application/json'
    }
  }, {
    adCreated: true,
    mfaEnabled: true,
    assignedO365LicenseType: 'EE-Basic'
  });

  await request({
    host: 'localhost',
    port: 5000,
    path: `/api/modules/${ticketId}/asset`,
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer bypass-SUPER_ADMIN',
      'Content-Type': 'application/json'
    }
  }, {
    hostname: 'TEST-HOST-01',
    serialNumber: `SN-${Date.now()}`,
    assetTag: `AST-${Date.now()}`,
    assignedEngineer: 'Engineer Bob'
  });

  // 5. Try transition again (should still fail since Credential Sheet is missing)
  console.log('\n--- 5. Trying to transition to Dispatch after IT/Asset specs complete (should still fail) ---');
  const failRes2 = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/tickets/${ticketId}/status`,
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer bypass-SUPER_ADMIN',
      'Content-Type': 'application/json'
    }
  }, { status: 'Dispatch' });
  console.log(`Status: ${failRes2.statusCode}, Error:`, failRes2.data.error);

  // 6. Upload Credential sheet
  console.log('\n--- 6. Uploading Credential Handover Package ---');
  const uploadRes = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/modules/${ticketId}/credentials`,
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer bypass-IT_ADMIN',
      'Content-Type': 'application/json'
    }
  }, {
    fileName: 'handover_sheet.xlsx',
    fileContent: 'UEsDBBQAAAAIAAAAAAD', // Dummy base64 string
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    passwordHint: 'Candidate DOB'
  });
  console.log('Upload Result:', uploadRes.data.success ? 'Success' : 'Fail', uploadRes.data.credentialSheet);

  // 7. Try transition again (should now succeed)
  console.log('\n--- 7. Trying to transition to Dispatch after credential upload (should succeed) ---');
  const successRes = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/tickets/${ticketId}/status`,
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer bypass-SUPER_ADMIN',
      'Content-Type': 'application/json'
    }
  }, { status: 'Dispatch' });
  console.log(`Status: ${successRes.statusCode}, Success:`, successRes.data.success, 'Ticket Status:', successRes.data.ticket?.status);

  // 8. Fetch activities logs to verify log entries
  console.log('\n--- 8. Fetching Ticket activity logs to verify audit trail ---');
  const { data: finalTicketRes } = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/tickets/${ticketId}`,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer bypass-SUPER_ADMIN'
    }
  });

  const logs = finalTicketRes.ticket.activityLogs;
  console.log('Audit Logs:');
  logs.slice(0, 8).forEach(l => {
    console.log(`- [${l.action}] details: ${l.details}`);
  });

  console.log('\n--- VERIFICATION WORKFLOW RUN COMPLETED ---');
}

run().catch(console.error);
