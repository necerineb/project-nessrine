import { Alert, StyleSheet, Text, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import RNPickerSelect from 'react-native-picker-select';
import Button from '../components/CustomButton';
import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getDatabase, ref, push, set } from 'firebase/database';

const AddDisponibility = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const datiUtente = route.params?.data;
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [isStartTimePickerVisible, setStartTimePickerVisibility] = useState(false);
    const [isEndTimePickerVisible, setEndTimePickerVisibility] = useState(false);

    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedStartTime, setSelectedStartTime] = useState(null);
    const [selectedEndTime, setSelectedEndTime] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);

    const subjectsArray = datiUtente.materia;

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const handleDateConfirm = (date) => {
        setSelectedDate(date);
        hideDatePicker();
    };

    const showStartTimePicker = () => {
        setStartTimePickerVisibility(true);
    };

    const hideStartTimePicker = () => {
        setStartTimePickerVisibility(false);
    };

    const handleStartTimeConfirm = (time) => {
        const adjustedTime = adjustMinutes(time);
        setSelectedStartTime(adjustedTime);
        setSelectedEndTime(null); // Reset the end time when start time is changed
        hideStartTimePicker();
    };

    const showEndTimePicker = () => {
        setEndTimePickerVisibility(true);
    };

    const hideEndTimePicker = () => {
        setEndTimePickerVisibility(false);
    };

    const handleEndTimeConfirm = (time) => {
        const adjustedTime = adjustMinutes(time);
        if (selectedStartTime && adjustedTime <= selectedStartTime) {
            Alert.alert('Error', 'End time must be at least one hour after start time');
        } else {
            setSelectedEndTime(adjustedTime);
            hideEndTimePicker();
        }
    };

    const adjustMinutes = (time) => {
        const minutes = time.getMinutes();
        const ore = time.getHours();

        if(ore < 14 || ore > 18){
            Alert.alert('Error', 'lo studio apre alle 14:30 e chiude alle 19');ù
        }else if(ore === 14 && minutes < 30){
            Alert.alert('Error', 'lo studio apre alle 14:30');
        }else{
            if (minutes >= 30) {
                time.setMinutes(30);
            } else {
                time.setMinutes(0);
            }
        }

        if (minutes >= 30) {
            time.setMinutes(30);
        } else {
            time.setMinutes(0);
        }
        return time;
    };

    const renderPickerOptions = () => {
        if (Array.isArray(subjectsArray) && subjectsArray.length > 0) {
            return subjectsArray.map((subject) => ({
                label: subject,
                value: subject
            }));
        } else {
            return [];
        }
    };

    const createDisponibility = async () => {
        try {
            const dispRef = ref(getDatabase(), 'lessons');
            const newDispRef = push(dispRef);

            const mese = selectedDate?.getMonth() + 1;
            const data = mese + ' ' + selectedDate?.getDate() + ' ' + selectedDate?.getFullYear();
            const orarioInizio = selectedStartTime?.getHours() + ':' + (selectedStartTime?.getMinutes() === 0 ? '00' : '30');
            const orarioFine = selectedEndTime?.getHours() + ':' + (selectedEndTime?.getMinutes() === 0 ? '00' : '30');

            const newDispData = {
                data: data,
                oraInizio: orarioInizio,
                oraFine: orarioFine,
                materia: selectedSubject,
                professore: datiUtente.id,
                studente: '',
            };

            return set(newDispRef, newDispData)
                .then(() => {
                    console.log('Nuova disponibilita aggiunto con successo:', newDispData);
                    navigation.navigate('TeacherHome', {
                        dati: datiUtente
                    });
                })
                .catch(error => {
                    console.error('Errore durante l aggiunta disponibilita:', error);
                });

        } catch (error) {
            console.error('Disponibilita error:', error);
            Alert.alert('Error', 'Failed to register user');
        }
    }

    return (
        <View style={styles.container}>
            <Button text="Select Date" onPress={showDatePicker} />
            <Button text="Select Start Time" onPress={showStartTimePicker} />
            <Button text="Select End Time" onPress={showEndTimePicker} />

            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleDateConfirm}
                onCancel={hideDatePicker}
            />

            <DateTimePickerModal
                isVisible={isStartTimePickerVisible}
                mode="time"
                onConfirm={handleStartTimeConfirm}
                onCancel={hideStartTimePicker}
                minimumDate={new Date(new Date().setHours(14, 30))}
                maximumDate={new Date(new Date().setHours(18, 0))}
            />

            <DateTimePickerModal
                isVisible={isEndTimePickerVisible}
                mode="time"
                onConfirm={handleEndTimeConfirm}
                onCancel={hideEndTimePicker}
                minimumDate={selectedStartTime ? new Date(selectedStartTime.getTime() + 60 * 60 * 1000) : undefined}
                maximumDate={new Date(new Date().setHours(19, 0))}
            />

            <RNPickerSelect
                onValueChange={(value) => setSelectedSubject(value)}
                items={renderPickerOptions()}
                placeholder={{ label: 'Select Subject', value: null }}
            />

            <Text style={styles.selectedDateText}>
                Selected Date: {selectedDate ? selectedDate.toLocaleDateString() : ''}
            </Text>

            <Text style={styles.selectedTimeText}>
                Selected Start Time: {selectedStartTime ? selectedStartTime.toLocaleTimeString() : ''}
            </Text>

            <Text style={styles.selectedTimeText}>
                Selected End Time: {selectedEndTime ? selectedEndTime.toLocaleTimeString() : ''}
            </Text>

            <Text style={styles.selectedSubjectText}>
                Selected Subject: {selectedSubject || 'N/A'}
            </Text>

            <Button
                text="fatto"
                onPress={createDisponibility}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedDateText: {
        marginTop: 10,
        fontSize: 16,
    },
    selectedTimeText: {
        marginTop: 10,
        fontSize: 16,
    },
    selectedSubjectText: {
        marginTop: 10,
        fontSize: 16,
    },
});

export default AddDisponibility;
