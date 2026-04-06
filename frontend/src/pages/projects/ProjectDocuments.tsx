import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchProjectDocuments, createDocument, updateDocument, deleteDocument } from '../../store/slices/documentSlice';
import { Plus, FileText, Trash2, Edit, X, Save } from 'lucide-react';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Avatar from '../../components/Avatar';
import { RichTextEditor } from '../../components/ui/RichTextEditor';

interface ProjectDocumentsProps {
  projectId: string;
}

const ProjectDocuments: React.FC<ProjectDocumentsProps> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const { documents, isLoading } = useAppSelector((state) => state.documents);
  const { currentProject } = useAppSelector((state) => state.projects);
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string } | null>(null);

  const isAdminOrSuper = ['manager', 'admin'].includes(currentUser?.role || '');
  const isManager = currentProject?.ownerId === currentUser?.id;
  const canEdit = isAdminOrSuper || isManager || true; // Let's allow any member to create docs

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectDocuments(projectId));
    }
  }, [projectId, dispatch]);

  const activeDoc = documents.find(d => d.id === activeDocId);

  const handleStartCreate = () => {
    setIsCreating(true);
    setIsEditing(false);
    setActiveDocId(null);
    setDocTitle('');
    setDocContent('');
  };

  const handleSelectDoc = (id: string) => {
    setActiveDocId(id);
    setIsCreating(false);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    if (activeDoc) {
      setDocTitle(activeDoc.title);
      setDocContent(activeDoc.content);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
    setDocTitle('');
    setDocContent('');
  };

  const handleSave = async () => {
    if (!docTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      if (isCreating) {
        const action = await dispatch(createDocument({ projectId, title: docTitle, content: docContent }));
        if (createDocument.fulfilled.match(action)) {
          toast.success('Document created');
          setIsCreating(false);
          setActiveDocId(action.payload.id);
        } else {
          toast.error('Failed to create document');
        }
      } else if (isEditing && activeDocId) {
        const action = await dispatch(updateDocument({ id: activeDocId, title: docTitle, content: docContent }));
        if (updateDocument.fulfilled.match(action)) {
          toast.success('Document updated');
          setIsEditing(false);
        } else {
          toast.error('Failed to update document');
        }
      }
    } catch (e) {
      toast.error('An error occurred');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await dispatch(deleteDocument(deleteConfirm.id)).unwrap();
      toast.success('Document deleted');
      if (activeDocId === deleteConfirm.id) {
        setActiveDocId(null);
      }
    } catch (e) {
      toast.error('Failed to delete document');
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (isLoading && documents.length === 0) {
    return (
      <div className="flex justify-center flex-col items-center py-10">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-text-muted text-sm">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[70vh] bg-background/50 rounded-lg p-2 border border-border">
      {/* Sidebar List */}
      <div className="w-full md:w-64 border-r border-border pr-4 flex flex-col shrink-0">
        <div className="flex items-center justify-between mb-4 mt-2">
          <h3 className="font-semibold text-text-main flex items-center gap-2">
            <FileText size={18} className="text-primary" /> Wiki / Docs
          </h3>
          {canEdit && (
            <Button size="sm" onClick={handleStartCreate} className="h-8 w-8 p-0 shrink-0" title="New Document">
              <Plus size={16} />
            </Button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pb-4 pr-1">
          {documents.map(doc => (
            <div 
              key={doc.id}
              onClick={() => handleSelectDoc(doc.id)}
              className={`p-2 rounded-lg cursor-pointer flex items-center justify-between group transition-colors ${activeDocId === doc.id ? 'bg-primary/20 border-primary/30 border text-primary' : 'hover:bg-surface border border-transparent'}`}
            >
              <div className="truncate text-sm font-medium">{doc.title}</div>
              {canEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm({ isOpen: true, id: doc.id });
                  }}
                  className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/20 hover:text-danger ${activeDocId === doc.id ? 'text-text-main' : 'text-text-muted'}`}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          {documents.length === 0 && !isCreating && (
            <p className="text-xs text-text-muted italic p-2">No documents found. Create one!</p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-surface rounded-lg border border-border">
        {isCreating || isEditing ? (
          <div className="flex flex-col h-full p-4">
            <div className="flex items-center gap-3 mb-4 shrink-0">
              <input 
                type="text" 
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                placeholder="Document Title"
                className="flex-1 text-xl font-bold bg-background border border-border rounded-lg px-4 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Button onClick={handleSave} leftIcon={<Save size={16} />} disabled={!docTitle.trim()}>
                Save
              </Button>
              <Button variant="secondary" onClick={handleCancelEdit} leftIcon={<X size={16} />}>
                Cancel
              </Button>
            </div>
            <div className="flex-1 overflow-hidden border border-border rounded-lg">
              <RichTextEditor
                content={docContent}
                onChange={setDocContent}
                readOnly={false}
              />
            </div>
          </div>
        ) : activeDoc ? (
          <div className="flex flex-col h-full">
            <div className="border-b border-border p-4 md:p-6 shrink-0 flex items-start justify-between bg-background/30">
              <div>
                <h2 className="text-2xl font-bold text-text-main mb-2 tracking-tight">{activeDoc.title}</h2>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <Avatar name={activeDoc.creator?.name || 'Unknown'} color={activeDoc.creator?.avatarColor} size={20} />
                    <span>{activeDoc.creator?.name || 'Unknown'}</span>
                  </div>
                  <span>•</span>
                  <span>Last updated: {new Date(activeDoc.updatedAt).toLocaleString()}</span>
                </div>
              </div>
              {canEdit && (
                <Button variant="secondary" onClick={handleStartEdit} leftIcon={<Edit size={16} />}>
                  Edit
                </Button>
              )}
            </div>
            <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar bg-background/5">
              <div 
                className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-text-main leading-relaxed"
                dangerouslySetInnerHTML={{ __html: activeDoc.content || '<span class="text-text-muted italic">There is no content in this document.</span>' }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
            <FileText size={48} className="mb-4 opacity-50 text-border" />
            <p className="text-lg font-medium text-text-main">No Document Selected</p>
            <p className="text-sm mt-1 mb-4">Select a document from the sidebar or create a new one.</p>
            {canEdit && <Button onClick={handleStartCreate} leftIcon={<Plus size={16} />}>Create Document</Button>}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm?.isOpen || false}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
};

export default ProjectDocuments;
