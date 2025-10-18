import * as groupService from "../services/groupService.js";
export async function getListGroup(req, res) {
  try {
    const userId = req.email;
    const groups = await groupService.getListGroup(userId);
    return res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
}

export async function createGroup(req, res) {
  try {
    const userId = req.email;
    const {name, nameOwner} = req.body;
    if (!name || !nameOwner){
      return res.status(400).json({
        success:false,
        error: "Thiếu dữ liệu, name hoặc là nameOwner"
      })
    }
    const groups = await groupService.createGroup(userId, {name, nameOwner});
    return res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
}

export async function deleteGroup(req, res) {
  try {
    const userId = req.email;
    const { groupId } = req.params;
    //sau này mà refactor code thì các validation này phải viết riêng ra, và các lỗi trả về phải viết một cái cha class
    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: "Thiếu trường GroupId",
      });
    }
    const result = await groupService.deleteGroup(userId, groupId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "internal server error",
    });
  }
}

export async function updateGroup(req, res) {
  try {
    const userId = req.email;
    const { groupId } = req.params;
    const updateData = req.body;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: "Thiếu thông tin group",
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Không có thông tin để cập nhật",
      });
    }

    const result = await groupService.updateGroup(userId, groupId, updateData);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}

export async function getDetailGroup(req, res) {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: "Thiếu group Id",
      });
    }

    const result = await groupService.getDetailGroup(groupId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "internal server error",
    });
  }
}

export async function inviteMember(req, res) {
  try {
    const { groupId, gmailInvite,name } = req.body;
    const userId = req.email;
    if (!groupId || !gmailInvite ||!name) {
      return res.status(400).json({
        success: false,
        error: "Thiếu dữ liệu, groupId, gmailInvite, name",
      });
    }
    const result = await groupService.inviteMember(userId,groupId,gmailInvite,name);
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}

export async function removeMember(req, res) {
  try {
    const userId = req.email;
    const { groupId, memberId } = req.body;

    if (!groupId || !memberId) {
      return res.status(400).json({
        success: false,
        error: "Thiếu groupId hoặc memberId",
      });
    }

    const result = await groupService.removeMember(userId, groupId, memberId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}


export async function leaveGroup(req, res) {
  try {
    const userId = req.email;
    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: "Thiếu groupId",
      });
    }

    const result = await groupService.leaveGroup(userId, groupId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}

export async function updateMemberGroup(req, res) {
  try {
    const userId = req.email;
    const { memberEmail, is_editor, name, groupId } = req.body;

    // 🔹 Validate dữ liệu đầu vào
    if (!groupId || !memberEmail || !name) {
      return res.status(400).json({
        success: false,
        error: "Thiếu dữ liệu groupId hoặc memberEmail, name",
      });
    }

    // 🔹 Gọi xuống service
    const result = await groupService.updateMemberData(
      userId,
      groupId,
      memberEmail,
      { is_editor, name }
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành viên thành công",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}
// import { mergeGroupVoicesUtil } from "../utils/mergeAudio.js";  // cái này để test api mergeAudio
// export async function mergeAudio(req, res) {
//   try {
//     // const userId = req.email;
//     const { groupId } = req.body;

//     if (!groupId) {
//       return res.status(400).json({
//         success: false,
//         error: "Thiếu groupId",
//       });
//     }

//     const result = await mergeGroupVoicesUtil( groupId);

//     return res.json({
//       success: true,
//       data: result,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       error: error.message || "Internal server error",
//     });
//   }
// }