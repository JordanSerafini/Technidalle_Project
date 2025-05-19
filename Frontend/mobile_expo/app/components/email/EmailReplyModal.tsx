import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmailData, ResponseLength } from '../../utils/types/mailTypes';
import mailFunctions from '../../utils/functions/mails.function';
import { useMailsStore } from '../../store/mailsStore';

const { fetchDraftResponse, sendEmailResponse, fetchRewrittenResponse } = mailFunctions;

interface EmailReplyModalProps {
    isVisible: boolean;
    onClose: () => void;
    emailId: string | null;
    responseLength?: ResponseLength;
}

export default function EmailReplyModal({
    isVisible,
    onClose,
    emailId,
    responseLength: initialResponseLength = 'normal'
}: EmailReplyModalProps) {
    const [loading, setLoading] = useState(false);
    const [emailData, setEmailData] = useState<EmailData | null>(null);
    const [response, setResponse] = useState('');
    const [subject, setSubject] = useState('');
    const [instructions, setInstructions] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [currentResponseLength, setCurrentResponseLength] = useState<ResponseLength>(initialResponseLength);

    const generateDraft = useCallback(async (id: string) => {
        if (!id) return;
        setLoading(true);
        try {
            const result = await fetchDraftResponse(id, currentResponseLength, false); // Utiliser le cache si disponible
            if (result.originalEmail) {
                setEmailData(result.originalEmail);
                setResponse(result.draftResponse);
                setSubject(`Re: ${result.originalEmail.subject}`); // Pré-remplir le sujet
            } else {
                Alert.alert("Erreur", "Impossible de charger les détails de l'email.");
                onClose(); // Fermer si l'email ne peut être chargé
            }
        } catch (error) {
            console.error("Erreur lors de la génération du brouillon:", error);
            Alert.alert("Erreur", "Impossible de générer un brouillon de réponse.");
            onClose();
        } finally {
            setLoading(false);
        }
    }, [currentResponseLength, onClose]);

    useEffect(() => {
        if (isVisible && emailId) {
            generateDraft(emailId);
        } else if (!isVisible) {
            // Réinitialiser l'état quand la modale est fermée
            setEmailData(null);
            setResponse('');
            setSubject('');
            setInstructions('');
            setEditMode(false);
            setLoading(false);
        }
    }, [isVisible, emailId, generateDraft]);

    const handleRewriteResponse = async () => {
        if (!instructions.trim() || !emailId) return;
        setLoading(true);
        try {
            const newResponse = await fetchRewrittenResponse(emailId, response, instructions, currentResponseLength, true);
            setResponse(newResponse);
            setInstructions('');
            setEditMode(false);
        } catch (error) {
            console.error("Erreur lors de la reformulation:", error);
            Alert.alert("Erreur", "Impossible de reformuler la réponse.");
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!response.trim() || !emailId) return;
        setLoading(true);
        try {
            const success = await sendEmailResponse(emailId, response, subject);
            if (success) {
                Alert.alert("Succès", "Réponse envoyée.");
                onClose();
            } else {
                Alert.alert("Erreur", "Impossible d'envoyer la réponse.");
            }
        } catch (error) {
            console.error("Erreur lors de l'envoi:", error);
            Alert.alert("Erreur", "Une erreur est survenue lors de l'envoi.");
        } finally {
            setLoading(false);
        }
    };
    
    const renderResponseLengthSelector = () => {
        return (
            <View style={styles.lengthSelectorContainer}>
                {(['court', 'normal', 'détaillé'] as ResponseLength[]).map(len => (
                    <TouchableOpacity
                        key={len}
                        style={[
                            styles.lengthButton,
                            currentResponseLength === len && styles.lengthButtonActive
                        ]}
                        onPress={() => setCurrentResponseLength(len)}
                    >
                        <Text style={[
                            styles.lengthButtonText,
                            currentResponseLength === len && styles.lengthButtonTextActive
                        ]}>
                            {len.charAt(0).toUpperCase() + len.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };


    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <ScrollView contentContainerStyle={styles.scrollViewContent}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Répondre à l'email</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close-circle" size={28} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        {loading && !emailData && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#3b82f6" />
                                <Text style={styles.loadingText}>Chargement de l'email...</Text>
                            </View>
                        )}

                        {emailData && (
                            <>
                                <View style={styles.emailInfoContainer}>
                                    <Text style={styles.emailSubject}>{emailData.subject}</Text>
                                    <Text style={styles.emailFrom}>De: {emailData.from}</Text>
                                    {emailData.analysis?.summary && 
                                        <Text style={styles.emailSummary}>Résumé: {emailData.analysis.summary}</Text>
                                    }
                                </View>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Sujet de la réponse"
                                    value={subject}
                                    onChangeText={setSubject}
                                    editable={!loading}
                                />
                                
                                {renderResponseLengthSelector()}

                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Votre réponse..."
                                    multiline
                                    numberOfLines={6}
                                    value={response}
                                    onChangeText={setResponse}
                                    textAlignVertical="top"
                                    editable={!loading}
                                />

                                {editMode ? (
                                    <>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Instructions pour reformuler (ex: plus formel)"
                                            value={instructions}
                                            onChangeText={setInstructions}
                                            editable={!loading}
                                        />
                                        <View style={styles.buttonRow}>
                                            <TouchableOpacity
                                                style={[styles.button, styles.secondaryButton]}
                                                onPress={() => setEditMode(false)}
                                                disabled={loading}
                                            >
                                                <Text style={styles.secondaryButtonText}>Annuler</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.button, styles.primaryButton, (!instructions.trim() || loading) && styles.buttonDisabled]}
                                                onPress={handleRewriteResponse}
                                                disabled={!instructions.trim() || loading}
                                            >
                                                {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.primaryButtonText}>Reformuler</Text>}
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.button, styles.outlineButton, { marginBottom: 10 } ]}
                                        onPress={() => setEditMode(true)}
                                        disabled={loading}
                                    >
                                        <Text style={styles.outlineButtonText}>Reformuler cette réponse</Text>
                                    </TouchableOpacity>
                                )}

                                <View style={styles.actionsContainer}>
                                    <TouchableOpacity
                                        style={[styles.button, styles.cancelButton]}
                                        onPress={onClose}
                                        disabled={loading}
                                    >
                                        <Text style={styles.cancelButtonText}>Annuler</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.button, styles.sendButton, (!response.trim() || loading) && styles.buttonDisabled]}
                                        onPress={handleSend}
                                        disabled={!response.trim() || loading}
                                    >
                                        {loading && emailData ? <ActivityIndicator color="#fff"/> : <Text style={styles.sendButtonText}>Envoyer</Text>}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '85%',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    scrollViewContent: {
        paddingBottom: 20, // Pour l'espace en bas du scroll
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    closeButton: {
        padding: 5,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#4B5563',
    },
    emailInfoContainer: {
        marginBottom: 15,
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    emailSubject: {
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#111827',
    },
    emailFrom: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 8,
    },
    emailSummary: {
        fontSize: 14,
        color: '#6B7280',
        fontStyle: 'italic',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 15,
        color: '#1F2937',
    },
    textArea: {
        minHeight: 120,
        textAlignVertical: 'top',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    primaryButton: {
        backgroundColor: '#3B82F6', // Bleu
        flex: 1,
        marginLeft: 5,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    secondaryButton: {
        backgroundColor: '#E5E7EB', // Gris clair
        flex: 1,
        marginRight: 5,
    },
    secondaryButtonText: {
        color: '#374151',
        fontWeight: 'bold',
        fontSize: 16,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    outlineButtonText: {
        color: '#3B82F6',
        fontWeight: 'bold',
        fontSize: 16,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    cancelButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        flex: 1,
        marginRight: 5,
    },
    cancelButtonText: {
        color: '#4B5563',
        fontWeight: 'bold',
        fontSize: 16,
    },
    sendButton: {
        backgroundColor: '#10B981', // Vert
        flex: 1,
        marginLeft: 5,
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    lengthSelectorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 5,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    lengthButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 3,
        borderRadius: 6,
        alignItems: 'center',
    },
    lengthButtonActive: {
        backgroundColor: '#3B82F6',
    },
    lengthButtonText: {
        color: '#374151',
        fontWeight: '500',
    },
    lengthButtonTextActive: {
        color: '#FFFFFF',
    },
}); 