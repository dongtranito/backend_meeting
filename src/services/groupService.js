import { db, admin } from "./firebaseService.js";

export async function getListGroup(userId) {
  try {
    const groupsRef = db.collection("groups");
    const snapshot = await groupsRef.get();

    const joinedGroups = [];
    const ownedGroups = [];

    for (const groupDoc of snapshot.docs) {
      const groupData = groupDoc.data();

      if (groupData.owner_id === userId) {
        ownedGroups.push({
          groupId: groupDoc.id,
          ...groupData,
          // memberInfo: { role: "owner", is_editor: true },
          createdAt: groupData.createdAt?.toDate().toISOString() || null,
          updatedAt: groupData.updatedAt?.toDate().toISOString() || null,
        });
      }

      const membersRef = groupDoc.ref.collection("members");
      const memberDoc = await membersRef.where("user_id", "==", userId).get();  // tìm coi thử mày có trong group đó không 

      if (!memberDoc.empty) {
        joinedGroups.push({
          groupId: groupDoc.id,
          ...groupData,
          createdAt: groupData.createdAt?.toDate().toISOString() || null,
          updatedAt: groupData.updatedAt?.toDate().toISOString() || null,
        });
      }
    }

    return {
      joinedGroups,
      ownedGroups,
    };
  } catch (err) {
    throw err;
  }
}

export async function createGroup(userId, group) {
  try {
    const newGroupRef = db.collection("groups").doc();
    const groupData = {
      name: group.name,
      description: group.description || "",
      owner_id: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await newGroupRef.set(groupData);
    await newGroupRef.collection("members").doc(userId).set({
      user_id: userId,
      role: "owner",
      is_editor: true,
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      groupId: newGroupRef.id,
      ...groupData,
      memberInfo: { role: "owner", is_editor: true },
    };
  } catch (error) {
    throw error;
  }
}

export async function deleteGroup(userId, groupId) {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      throw new Error("Không tồn tại group");
    }

    const groupData = groupDoc.data();
    if (groupData.owner_id !== userId) {
      throw new Error("chỉ có chủ group mới có quyền xóa group");
    }

    // Xóa subcollection members
    const membersSnapshot = await groupRef.collection("members").get();
    const batch = db.batch();

    membersSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Xóa document group
    batch.delete(groupRef);

    await batch.commit();

    return { groupId };
  } catch (err) {
    throw err;
  }
}

export async function updateGroup(userId, groupId, updateData) {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      throw new Error("Group not found");
    }

    const groupData = groupDoc.data();
    if (groupData.owner_id !== userId) {
      throw new Error("Chỉ có chủ group mới có quyền sửa thông tin");
    }

    const updatedData = {
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await groupRef.update(updatedData);

    return {
      groupId,
      ...groupData,
      ...updatedData,
    };
  } catch (err) {
    throw err;
  }
}

export async function getDetailGroup(groupId) {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) {
      throw new Error("Group not found");
    }

    const membersSnapshot = await groupRef.collection("members").get();
    const membersCount = membersSnapshot.size;

    const members = membersSnapshot.docs.map((doc) => ({
      ...doc.data(),
      joinedAt: doc.data().joinedAt?.toDate().toISOString(),
    }));

    return {
      groupId: groupDoc.id,
      ...groupDoc.data(),
      membersCount,
      members,
      createdAt: groupDoc.data().createdAt.toDate().toISOString(),
      updatedAt: groupDoc.data().updatedAt.toDate().toISOString(),

    };
  } catch (error) {
    throw err;
  }
}

export async function inviteMember(userId, groupId, gmailInvite) {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) {
      throw new Error("Group not found");
    }
    if (groupDoc.data().owner_id !== userId) {
      throw new Error("Chỉ có chủ group mới có quyền mời thành viên");
    }

    const userRef = db.collection("users").doc(gmailInvite);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      throw new Error(`Không tồn tại user có gmail ${gmailInvite}`);
    }

    const memberRef = groupRef.collection("members").doc(gmailInvite);
    const memberDoc = await memberRef.get();

    if (memberDoc.exists) {
      throw new Error("User đã là thành viên trong group");
    }
    await groupRef.collection("members").doc(gmailInvite).set({
      user_id: gmailInvite,
      role: "member",
      is_editor: false,
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      groupId,
      invitedUser: gmailInvite,
    };
  } catch (error) {
    throw error;
  }
}

export async function removeMember(userId, groupId, memberId) {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      throw new Error("Group không tồn tại");
    }

    const groupData = groupDoc.data();

    if (groupData.owner_id !== userId) {
      throw new Error("Chỉ có chủ group mới được xóa thành viên");
    }

    if (userId === memberId) {
      throw new Error("Không thể tự xóa bản thân");
    }

    const memberRef = groupRef.collection("members").doc(memberId);
    const memberDoc = await memberRef.get();

    if (!memberDoc.exists) {
      throw new Error("Thành viên không tồn tại trong group");
    }

    await memberRef.delete();

    return {
      groupId,
      removedMember: memberId,
    };
  } catch (error) {
    throw error;
  }
}

export async function leaveGroup(userId, groupId) {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      throw new Error("Group không tồn tại");
    }

    const groupData = groupDoc.data();

    if (groupData.owner_id === userId) {
      throw new Error("Chủ group không tự thế rời group được");
    }

    const memberRef = groupRef.collection("members").doc(userId);
    const memberDoc = await memberRef.get();

    if (!memberDoc.exists) {
      throw new Error("Bạn không phải là thành viên trong group này");
    }

    await memberRef.delete();

    return {
      message: "Rời group thành công",
      groupId,
    };
  } catch (error) {
    throw error;
  }
}